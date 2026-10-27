-- Group battles: friends join a lobby with a code, the host starts, everyone
-- damages one shared boss. Boss HP grows with the team; boss attacks hit
-- every pet still standing; the battle is lost when none are.
--
-- Run in the Supabase dashboard after 0004: SQL Editor → New query →
-- paste → Run. Safe to run again.

alter table public.battles
  -- Kept from the lobby so the start can size the boss for the team.
  add column if not exists base_hp integer,
  add column if not exists hp_per_extra numeric,
  add column if not exists time_limit_sec integer,
  add column if not exists max_players integer not null default 5;

-- Set when a member leaves an active group battle: their pet is out and
-- they get no rewards.
alter table public.battle_participants
  add column if not exists left_at timestamptz;

-- A 6-character join code nobody has used, without look-alike characters
-- (no 0/O, 1/I/L).
create or replace function public.game_join_code()
returns text
language plpgsql as $$
declare
  v_chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    select string_agg(substr(v_chars, 1 + floor(random() * length(v_chars))::integer, 1), '')
      into v_code
      from generate_series(1, 6);
    exit when not exists (select 1 from public.battles where join_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Opens a group lobby with this player as host, or returns the unfinished
-- group battle they're already in.
create or replace function public.battle_create_group(
  p_player uuid,
  p_pet uuid,
  p_pet_max_hp integer,
  p_boss text,
  p_base_hp integer,
  p_hp_per_extra numeric,
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
  perform 1 from public.players where id = p_player for update;

  select b.id into v_battle
    from public.battles b
    join public.battle_participants bp on bp.battle_id = b.id
   where bp.player_id = p_player and bp.left_at is null
     and b.mode = 'group' and b.status in ('lobby', 'active')
   order by b.created_at desc
   limit 1;
  if v_battle is not null then
    return v_battle;
  end if;

  insert into public.battles (
    boss_id, mode, status, join_code, host_player_id, max_hp, hp,
    base_hp, hp_per_extra, time_limit_sec,
    attack_min_sec, attack_max_sec, attack_damage
  ) values (
    p_boss, 'group', 'lobby', public.game_join_code(), p_player, p_base_hp, p_base_hp,
    p_base_hp, p_hp_per_extra, p_time_limit_sec,
    p_attack_min_sec, p_attack_max_sec, p_attack_damage
  ) returning id into v_battle;

  insert into public.battle_participants (
    battle_id, player_id, pet_id, pet_hp, pet_max_hp, current_question_id
  ) values (
    v_battle, p_player, p_pet, p_pet_max_hp, p_pet_max_hp, p_first_question
  );
  return v_battle;
end;
$$;

-- Joins a group lobby by code. Someone already in it (and not gone) gets
-- the battle back, so reopening the page reconnects. Returns { battle } or
-- { error: no_code | started | full }.
create or replace function public.battle_join_group(
  p_code text,
  p_player uuid,
  p_pet uuid,
  p_pet_max_hp integer,
  p_first_question text
) returns jsonb
language plpgsql as $$
declare
  b public.battles%rowtype;
begin
  select * into b from public.battles
   where join_code = upper(trim(p_code)) and mode = 'group'
   for update;
  if not found or b.status not in ('lobby', 'active') then
    return jsonb_build_object('error', 'no_code');
  end if;

  if exists (
    select 1 from public.battle_participants
     where battle_id = b.id and player_id = p_player and left_at is null
  ) then
    return jsonb_build_object('battle', b.id);
  end if;
  if b.status <> 'lobby' then
    return jsonb_build_object('error', 'started');
  end if;
  if (select count(*) from public.battle_participants where battle_id = b.id and left_at is null)
     >= b.max_players then
    return jsonb_build_object('error', 'full');
  end if;

  insert into public.battle_participants (
    battle_id, player_id, pet_id, pet_hp, pet_max_hp, current_question_id
  ) values (
    b.id, p_player, p_pet, p_pet_max_hp, p_pet_max_hp, p_first_question
  )
  on conflict (battle_id, player_id) do update
    set left_at = null,
        pet_id = excluded.pet_id,
        pet_hp = excluded.pet_hp,
        pet_max_hp = excluded.pet_max_hp,
        current_question_id = excluded.current_question_id,
        joined_at = now();
  return jsonb_build_object('battle', b.id);
end;
$$;

-- The host starts the lobby: the boss gets base HP × (1 + share × (players
-- − 1)), and the attack schedule and time limit begin. Needs 2+ players.
create or replace function public.battle_start_group(p_battle uuid, p_player uuid)
returns jsonb
language plpgsql as $$
declare
  b public.battles%rowtype;
  v_players integer;
  v_hp integer;
begin
  select * into b from public.battles where id = p_battle for update;
  if not found or b.mode <> 'group' then
    return jsonb_build_object('error', 'no_battle');
  end if;
  if b.host_player_id is distinct from p_player then
    return jsonb_build_object('error', 'not_host');
  end if;
  if b.status <> 'lobby' then
    return jsonb_build_object('error', 'started');
  end if;
  select count(*) into v_players
    from public.battle_participants where battle_id = p_battle and left_at is null;
  if v_players < 2 then
    return jsonb_build_object('error', 'need_two');
  end if;

  v_hp := round(b.base_hp * (1 + b.hp_per_extra * (v_players - 1)))::integer;
  update public.battles
     set status = 'active', max_hp = v_hp, hp = v_hp, started_at = now(),
         next_attack_at = now() + make_interval(secs => attack_max_sec),
         deadline_at = now() + make_interval(secs => time_limit_sec)
   where id = p_battle;
  update public.battle_participants set question_issued_at = now()
   where battle_id = p_battle and left_at is null;
  return jsonb_build_object('ok', true, 'players', v_players, 'hp', v_hp);
end;
$$;

-- Leaving a battle. Solo: it ends (no victory). Group lobby: the host
-- closes it, others just leave. Active group battle: the player's pet is
-- out and they get no rewards; lost if nobody is left standing.
create or replace function public.battle_leave(p_battle uuid, p_player uuid)
returns boolean
language plpgsql as $$
declare
  b public.battles%rowtype;
begin
  select * into b from public.battles where id = p_battle for update;
  if not found then
    return false;
  end if;

  if b.mode = 'solo' then
    update public.battles
       set status = 'ended', ended_at = now(), next_attack_at = null
     where id = p_battle and host_player_id = p_player and status in ('active', 'paused');
    return found;
  end if;

  if b.status = 'lobby' then
    if b.host_player_id = p_player then
      update public.battles set status = 'ended', ended_at = now() where id = p_battle;
    else
      delete from public.battle_participants where battle_id = p_battle and player_id = p_player;
    end if;
    return true;
  end if;

  if b.status = 'active' then
    update public.battle_participants
       set left_at = now(), pet_hp = 0
     where battle_id = p_battle and player_id = p_player and left_at is null;
    if not found then
      return false;
    end if;
    if not exists (
      select 1 from public.battle_participants where battle_id = p_battle and pet_hp > 0
    ) then
      update public.battles
         set status = 'lost', ended_at = now(), next_attack_at = null
       where id = p_battle;
    end if;
    return true;
  end if;
  return false;
end;
$$;

-- battle_leave replaces the solo-only forfeit.
drop function if exists public.battle_forfeit(uuid, uuid);

-- The battle view now lists the whole team: name, pet, HP, damage.
create or replace function public.battle_view(p_battle uuid, p_player uuid)
returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'battle', to_jsonb(b),
    'me', to_jsonb(p),
    'pet', to_jsonb(pp),
    'now', now(),
    'team', (
      select coalesce(jsonb_agg(jsonb_build_object(
          'username', pl.username,
          'line_id', tp.line_id,
          'level', tp.level,
          'pet_hp', t.pet_hp,
          'pet_max_hp', t.pet_max_hp,
          'damage', t.damage_dealt,
          'correct', t.correct_count,
          'left', t.left_at is not null,
          'host', t.player_id = b.host_player_id,
          'me', t.player_id = p_player
        ) order by t.joined_at), '[]'::jsonb)
        from public.battle_participants t
        join public.players pl on pl.id = t.player_id
        left join public.player_pets tp on tp.id = t.pet_id
       where t.battle_id = b.id
    )
  )
    from public.battles b
    join public.battle_participants p on p.battle_id = b.id and p.player_id = p_player
    left join public.player_pets pp on pp.id = p.pet_id
   where b.id = p_battle;
$$;

-- Same as 0004, except a member who left mid-battle gets no rewards.
create or replace function public.battle_claim_rewards(
  p_battle uuid,
  p_username text,
  p_exp integer,
  p_pet_exp integer,
  p_egg_line text,
  p_egg_rarity text
) returns jsonb
language plpgsql as $$
declare
  v_player uuid;
  b public.battles%rowtype;
  p public.battle_participants%rowtype;
  v_egg uuid;
begin
  select id into v_player from public.players where lower(username) = lower(p_username);
  if v_player is null then
    return jsonb_build_object('error', 'not_in_battle');
  end if;
  select * into b from public.battles where id = p_battle;
  if not found or b.status <> 'won' then
    return jsonb_build_object('error', 'not_won');
  end if;
  select * into p from public.battle_participants
   where battle_id = p_battle and player_id = v_player for update;
  if not found then
    return jsonb_build_object('error', 'not_in_battle');
  end if;
  if p.left_at is not null then
    return jsonb_build_object('error', 'left');
  end if;
  if p.rewarded_at is not null then
    return jsonb_build_object('error', 'already_rewarded');
  end if;

  update public.players
     set exp = exp + greatest(p_exp, 0),
         level = 1 + (exp + greatest(p_exp, 0)) / 100
   where id = v_player;

  if p.pet_id is not null then
    perform public.game_add_pet_exp(p.pet_id, greatest(p_pet_exp, 0));
  end if;

  if p_egg_line is not null then
    insert into public.eggs (player_id, battle_id, boss_id, line_id, rarity)
    values (v_player, p_battle, b.boss_id, p_egg_line, p_egg_rarity)
    on conflict (battle_id, player_id) do nothing
    returning id into v_egg;
  end if;

  update public.battle_participants
     set rewarded_at = now(),
         reward_exp = greatest(p_exp, 0),
         reward_pet_exp = greatest(p_pet_exp, 0),
         reward_egg_line = case when v_egg is not null then p_egg_line end,
         reward_egg_rarity = case when v_egg is not null then p_egg_rarity end
   where battle_id = p_battle and player_id = v_player;

  return jsonb_build_object('ok', true);
end;
$$;

-- Only the server (service role) may call these.
revoke execute on function public.game_join_code() from public, anon, authenticated;
revoke execute on function public.battle_create_group(uuid, uuid, integer, text, integer, numeric, integer, integer, integer, integer, text) from public, anon, authenticated;
revoke execute on function public.battle_join_group(text, uuid, uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.battle_start_group(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.battle_leave(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.battle_view(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.battle_claim_rewards(uuid, text, integer, integer, text, text) from public, anon, authenticated;
grant execute on function public.game_join_code() to service_role;
grant execute on function public.battle_create_group(uuid, uuid, integer, text, integer, numeric, integer, integer, integer, integer, text) to service_role;
grant execute on function public.battle_join_group(text, uuid, uuid, integer, text) to service_role;
grant execute on function public.battle_start_group(uuid, uuid) to service_role;
grant execute on function public.battle_leave(uuid, uuid) to service_role;
grant execute on function public.battle_view(uuid, uuid) to service_role;
grant execute on function public.battle_claim_rewards(uuid, text, integer, integer, text, text) to service_role;
