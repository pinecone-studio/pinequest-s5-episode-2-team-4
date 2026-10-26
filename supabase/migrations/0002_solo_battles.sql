-- Solo boss battles: atomic answers, server-scheduled boss attacks, time
-- limit. A pet at 0 HP has fainted and stays out; when no pet is left
-- standing the battle is lost.
--
-- Run in the Supabase dashboard after 0001: SQL Editor → New query →
-- paste → Run. Safe to run again; running it replaces earlier versions of
-- these functions.
--
-- The app checks answers (the question bank lives in the code) and passes
-- the result in; these functions decide everything else inside one locked
-- transaction, so a double click, a retry or two tabs can't apply anything
-- twice.

alter table public.battles
  add column if not exists attack_min_sec integer,
  add column if not exists attack_max_sec integer,
  add column if not exists attack_damage integer,
  add column if not exists deadline_at timestamptz;

alter table public.battle_participants
  add column if not exists current_question_id text,
  add column if not exists question_issued_at timestamptz,
  add column if not exists faint_count integer not null default 0;
-- Pets no longer recover mid-battle.
alter table public.battle_participants drop column if exists knocked_out_until;

-- Finds a player's battles quickly.
create index if not exists battle_participants_player on public.battle_participants (player_id);

-- The player row for a LevelUp account, created on first use. Usernames
-- match case-insensitively (see players_username_key).
create or replace function public.game_player_id(p_username text, p_role text, p_class_code text)
returns uuid
language sql as $$
  insert into public.players (username, role, class_code)
  values (p_username, p_role, p_class_code)
  on conflict ((lower(username))) do update
    set role = excluded.role,
        class_code = coalesce(excluded.class_code, public.players.class_code)
  returning id;
$$;

-- Records the player's current pet (from their LevelUp account) as their
-- active pet and returns its id.
create or replace function public.game_active_pet(
  p_player uuid, p_line text, p_level integer, p_max_hp integer
) returns uuid
language plpgsql as $$
declare
  v_pet uuid;
begin
  update public.player_pets set is_active = false
   where player_id = p_player and is_active and line_id <> p_line;

  insert into public.player_pets (player_id, line_id, level, max_hp, is_active)
  values (p_player, p_line, p_level, p_max_hp, true)
  on conflict (player_id, line_id) do update
    set level = greatest(public.player_pets.level, excluded.level),
        max_hp = excluded.max_hp,
        is_active = true
  returning id into v_pet;

  return v_pet;
end;
$$;

-- Seconds until the next boss attack: a fixed pseudo-random pick in the
-- boss's range, so the schedule never depends on who asks.
create or replace function public.battle_attack_gap(
  p_battle uuid, p_count integer, p_min integer, p_max integer
) returns integer
language sql stable as $$
  select p_min + (abs(hashtext(p_battle::text || ':' || p_count)) % (p_max - p_min + 1));
$$;

-- Catch the battle up to now: end it when time runs out, then apply every
-- boss attack that is due, each once. Lost when no pet is left standing.
create or replace function public.battle_tick(p_battle uuid)
returns void
language plpgsql as $$
declare
  b public.battles%rowtype;
begin
  select * into b from public.battles where id = p_battle for update;
  if not found or b.status <> 'active' then
    return;
  end if;

  if b.deadline_at is not null and now() >= b.deadline_at then
    update public.battles
       set status = 'lost', ended_at = now(), next_attack_at = null
     where id = p_battle;
    return;
  end if;

  while b.next_attack_at is not null and b.next_attack_at <= now() loop
    -- Right-hand sides see the row before this update.
    update public.battle_participants
       set pet_hp = greatest(pet_hp - b.attack_damage, 0),
           faint_count = faint_count + case when pet_hp - b.attack_damage <= 0 then 1 else 0 end
     where battle_id = p_battle and pet_hp > 0;

    b.attack_count := b.attack_count + 1;

    if not exists (
      select 1 from public.battle_participants where battle_id = p_battle and pet_hp > 0
    ) then
      update public.battles
         set attack_count = b.attack_count, status = 'lost',
             ended_at = b.next_attack_at, next_attack_at = null
       where id = p_battle;
      return;
    end if;

    b.next_attack_at := b.next_attack_at + make_interval(
      secs => public.battle_attack_gap(p_battle, b.attack_count, b.attack_min_sec, b.attack_max_sec)
    );
  end loop;

  update public.battles
     set attack_count = b.attack_count, next_attack_at = b.next_attack_at
   where id = p_battle;
end;
$$;

-- Starts a solo battle, or returns the player's unfinished one.
create or replace function public.battle_start_solo(
  p_player uuid,
  p_pet uuid,
  p_pet_max_hp integer,
  p_boss text,
  p_max_hp integer,
  p_attack_min_sec integer,
  p_attack_max_sec integer,
  p_attack_damage integer,
  p_time_limit_sec integer,
  p_first_question text
) returns uuid
language plpgsql as $$
declare
  v_battle uuid;
begin
  -- Serialise starts for this player so two clicks make one battle.
  perform 1 from public.players where id = p_player for update;

  select b.id into v_battle
    from public.battles b
    join public.battle_participants bp on bp.battle_id = b.id
   where bp.player_id = p_player and b.mode = 'solo' and b.status in ('active', 'paused')
   order by b.created_at desc
   limit 1;
  if v_battle is not null then
    return v_battle;
  end if;

  insert into public.battles (
    boss_id, mode, status, host_player_id, max_hp, hp,
    attack_min_sec, attack_max_sec, attack_damage,
    next_attack_at, started_at, deadline_at
  ) values (
    p_boss, 'solo', 'active', p_player, p_max_hp, p_max_hp,
    p_attack_min_sec, p_attack_max_sec, p_attack_damage,
    now() + make_interval(secs => p_attack_max_sec), now(),
    now() + make_interval(secs => p_time_limit_sec)
  ) returning id into v_battle;

  insert into public.battle_participants (
    battle_id, player_id, pet_id, pet_hp, pet_max_hp, current_question_id, question_issued_at
  ) values (
    v_battle, p_player, p_pet, p_pet_max_hp, p_pet_max_hp, p_first_question, now()
  );

  return v_battle;
end;
$$;

-- One player's view of a battle as JSON (battle row, their row, server
-- time), or null if they aren't in it. Doesn't change anything.
create or replace function public.battle_view(p_battle uuid, p_player uuid)
returns jsonb
language sql stable as $$
  select jsonb_build_object('battle', to_jsonb(b), 'me', to_jsonb(p), 'now', now())
    from public.battles b
    join public.battle_participants p on p.battle_id = b.id and p.player_id = p_player
   where b.id = p_battle;
$$;

-- Catches the battle up and returns this player's view, in one round trip
-- (the battle screen polls this).
create or replace function public.battle_state(p_battle uuid, p_username text)
returns jsonb
language plpgsql as $$
declare
  v_player uuid;
begin
  select id into v_player from public.players where lower(username) = lower(p_username);
  if v_player is null then
    return null;
  end if;
  perform public.battle_tick(p_battle);
  return public.battle_view(p_battle, v_player);
end;
$$;

-- An earlier version took a player id and a single next question.
drop function if exists public.battle_answer(uuid, uuid, uuid, text, boolean, integer, integer, text);

-- Applies one answer and returns what happened plus the new view, in one
-- round trip. p_damage is the base damage for the question; the combo
-- bonus (+10% per correct answer in a row, up to +50%) is added here.
-- p_next_candidates are possible next questions for p_boss in random
-- order; the first one not asked recently in this battle is used.
create or replace function public.battle_answer(
  p_battle uuid,
  p_boss text,
  p_username text,
  p_attempt uuid,
  p_question text,
  p_correct boolean,
  p_damage integer,
  p_pet_damage integer,
  p_next_candidates text[]
) returns jsonb
language plpgsql as $$
declare
  v_player uuid;
  b public.battles%rowtype;
  p public.battle_participants%rowtype;
  v_damage integer := 0;
  v_pet_damage integer := 0;
  v_fainted boolean := false;
  v_next text;
begin
  select id into v_player from public.players where lower(username) = lower(p_username);
  if v_player is null then
    return jsonb_build_object('error', 'not_in_battle');
  end if;

  perform public.battle_tick(p_battle);

  select * into b from public.battles where id = p_battle for update;
  if not found then
    return jsonb_build_object('error', 'no_battle');
  end if;
  select * into p from public.battle_participants
   where battle_id = p_battle and player_id = v_player for update;
  if not found then
    return jsonb_build_object('error', 'not_in_battle');
  end if;

  if exists (
    select 1 from public.battle_answers
     where battle_id = p_battle and player_id = v_player and attempt_id = p_attempt
  ) then
    return jsonb_build_object('error', 'duplicate', 'view', public.battle_view(p_battle, v_player));
  end if;
  if b.status <> 'active' then
    return jsonb_build_object('error', 'not_active', 'view', public.battle_view(p_battle, v_player));
  end if;
  -- The candidates were picked for this boss.
  if b.boss_id is distinct from p_boss then
    return jsonb_build_object('error', 'invalid', 'view', public.battle_view(p_battle, v_player));
  end if;
  if p.pet_hp = 0 then
    return jsonb_build_object('error', 'fainted', 'view', public.battle_view(p_battle, v_player));
  end if;
  -- Only the question the server asked counts.
  if p.current_question_id is distinct from p_question then
    return jsonb_build_object('error', 'wrong_question', 'view', public.battle_view(p_battle, v_player));
  end if;

  if p_correct then
    v_damage := least(round(greatest(p_damage, 0) * (1 + least(p.combo, 5) * 0.1))::integer, b.hp);
  else
    v_pet_damage := least(greatest(p_pet_damage, 0), p.pet_hp);
    v_fainted := p.pet_hp - v_pet_damage <= 0;
  end if;

  -- Next question: the first candidate not among the last 8 asked.
  select c into v_next
    from unnest(p_next_candidates) with ordinality as t(c, i)
   where c <> p_question
     and c not in (
       select question_id from public.battle_answers
        where battle_id = p_battle and player_id = v_player
        order by id desc
        limit 8
     )
   order by i
   limit 1;
  v_next := coalesce(v_next, p_next_candidates[1], p_question);

  insert into public.battle_answers (
    battle_id, player_id, attempt_id, question_id, correct, damage, pet_damage
  ) values (
    p_battle, v_player, p_attempt, p_question, p_correct, v_damage, v_pet_damage
  );

  update public.battle_participants
     set damage_dealt = damage_dealt + v_damage,
         correct_count = correct_count + case when p_correct then 1 else 0 end,
         wrong_count = wrong_count + case when p_correct then 0 else 1 end,
         combo = case when p_correct then combo + 1 else 0 end,
         best_combo = greatest(best_combo, case when p_correct then combo + 1 else 0 end),
         pet_hp = pet_hp - v_pet_damage,
         faint_count = faint_count + case when v_fainted then 1 else 0 end,
         current_question_id = v_next,
         question_issued_at = now(),
         last_seen_at = now()
   where battle_id = p_battle and player_id = v_player;

  update public.battles
     set hp = hp - v_damage,
         status = case when hp - v_damage <= 0 then 'won' else status end,
         ended_at = case when hp - v_damage <= 0 then now() else ended_at end,
         next_attack_at = case when hp - v_damage <= 0 then null else next_attack_at end
   where id = p_battle;

  -- The last pet standing fainted from a wrong answer.
  if v_fainted and not exists (
    select 1 from public.battle_participants where battle_id = p_battle and pet_hp > 0
  ) then
    update public.battles
       set status = 'lost', ended_at = now(), next_attack_at = null
     where id = p_battle and status = 'active';
  end if;

  return jsonb_build_object(
    'damage', v_damage,
    'pet_damage', v_pet_damage,
    'combo', case when p_correct then p.combo + 1 else 0 end,
    'fainted', v_fainted,
    'view', public.battle_view(p_battle, v_player)
  );
end;
$$;

-- Leaving a solo battle ends it (no victory). Returns true if it was ended.
create or replace function public.battle_forfeit(p_battle uuid, p_player uuid)
returns boolean
language plpgsql as $$
begin
  update public.battles
     set status = 'ended', ended_at = now(), next_attack_at = null
   where id = p_battle and mode = 'solo' and host_player_id = p_player
     and status in ('active', 'paused');
  return found;
end;
$$;

-- Only the server (service role) may call these.
revoke execute on function public.game_player_id(text, text, text) from public, anon, authenticated;
revoke execute on function public.battle_forfeit(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.game_active_pet(uuid, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.battle_attack_gap(uuid, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.battle_tick(uuid) from public, anon, authenticated;
revoke execute on function public.battle_start_solo(uuid, uuid, integer, text, integer, integer, integer, integer, integer, text) from public, anon, authenticated;
revoke execute on function public.battle_answer(uuid, text, text, uuid, text, boolean, integer, integer, text[]) from public, anon, authenticated;
revoke execute on function public.battle_view(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.battle_state(uuid, text) from public, anon, authenticated;
grant execute on function public.battle_attack_gap(uuid, integer, integer, integer) to service_role;
grant execute on function public.battle_tick(uuid) to service_role;
grant execute on function public.battle_start_solo(uuid, uuid, integer, text, integer, integer, integer, integer, integer, text) to service_role;
grant execute on function public.battle_answer(uuid, text, text, uuid, text, boolean, integer, integer, text[]) to service_role;
grant execute on function public.battle_view(uuid, uuid) to service_role;
grant execute on function public.battle_state(uuid, text) to service_role;
grant execute on function public.game_player_id(text, text, text) to service_role;
grant execute on function public.game_active_pet(uuid, text, integer, integer) to service_role;
grant execute on function public.battle_forfeit(uuid, uuid) to service_role;
