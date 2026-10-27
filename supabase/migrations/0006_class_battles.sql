-- LevelUp: classroom battles. A teacher opens one for a class code and the
-- whole class fights one boss. Students join by their class code or the
-- join code, at any time: someone joining a fight under way makes the boss
-- stronger, and someone who leaves can come back with nothing reset. The
-- teacher starts, pauses, resumes and ends it. Run after 0005.

-- A class student who leaves keeps their pet's HP here until they return.
alter table public.battle_participants
  add column if not exists left_pet_hp integer;

-- The teacher opens a class battle, or gets back the one already open.
create or replace function public.battle_create_class(
  p_teacher uuid,
  p_class_code text,
  p_boss text,
  p_base_hp integer,
  p_hp_per_extra numeric,
  p_attack_min_sec integer,
  p_attack_max_sec integer,
  p_attack_damage integer,
  p_time_limit_sec integer
) returns uuid
language plpgsql as $$
declare
  v_battle uuid;
begin
  perform 1 from public.players where id = p_teacher for update;

  select id into v_battle
    from public.battles
   where host_player_id = p_teacher and mode = 'class'
     and status in ('lobby', 'active', 'paused')
   order by created_at desc
   limit 1;
  if v_battle is not null then
    return v_battle;
  end if;

  insert into public.battles (
    boss_id, mode, status, join_code, class_code, host_player_id, max_hp, hp,
    base_hp, hp_per_extra, time_limit_sec, max_players,
    attack_min_sec, attack_max_sec, attack_damage
  ) values (
    p_boss, 'class', 'lobby', public.game_join_code(), upper(trim(p_class_code)), p_teacher,
    p_base_hp, p_base_hp, p_base_hp, p_hp_per_extra, p_time_limit_sec, 100,
    p_attack_min_sec, p_attack_max_sec, p_attack_damage
  ) returning id into v_battle;
  return v_battle;
end;
$$;

-- Joins a group or class battle by code. Someone already in it gets the
-- battle back. Group: lobby only, up to max_players. Class: any time until
-- it ends; a late joiner adds base HP × share to the boss, and someone who
-- left comes back with their pet's HP and their stats. Returns { battle } or
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
  p public.battle_participants%rowtype;
  v_member boolean;
  v_extra integer;
begin
  select * into b from public.battles
   where join_code = upper(trim(p_code)) and mode in ('group', 'class')
   for update;
  if not found or b.status not in ('lobby', 'active', 'paused')
     or (b.mode = 'class' and b.host_player_id = p_player) then
    return jsonb_build_object('error', 'no_code');
  end if;

  select * into p from public.battle_participants
   where battle_id = b.id and player_id = p_player
   for update;
  v_member := found;
  if v_member and p.left_at is null then
    return jsonb_build_object('battle', b.id);
  end if;

  if b.mode = 'class' then
    if v_member then
      update public.battle_participants
         set left_at = null,
             pet_hp = coalesce(left_pet_hp, pet_hp),
             left_pet_hp = null,
             last_seen_at = now()
       where battle_id = b.id and player_id = p_player;
      return jsonb_build_object('battle', b.id);
    end if;
    if (select count(*) from public.battle_participants where battle_id = b.id) >= b.max_players then
      return jsonb_build_object('error', 'full');
    end if;
    insert into public.battle_participants (
      battle_id, player_id, pet_id, pet_hp, pet_max_hp, current_question_id, question_issued_at
    ) values (
      b.id, p_player, p_pet, p_pet_max_hp, p_pet_max_hp, p_first_question, now()
    );
    if b.status <> 'lobby' then
      v_extra := round(b.base_hp * b.hp_per_extra)::integer;
      update public.battles
         set max_hp = max_hp + v_extra, hp = hp + v_extra
       where id = b.id;
    end if;
    return jsonb_build_object('battle', b.id);
  end if;

  -- Group battles, as in 0005.
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

-- The teacher starts the class battle: the boss gets base HP × (1 + share ×
-- (students − 1)), and the attack schedule and time limit begin. Needs 1+.
create or replace function public.battle_start_class(p_battle uuid, p_teacher uuid)
returns jsonb
language plpgsql as $$
declare
  b public.battles%rowtype;
  v_students integer;
  v_hp integer;
begin
  select * into b from public.battles where id = p_battle for update;
  if not found or b.mode <> 'class' then
    return jsonb_build_object('error', 'no_battle');
  end if;
  if b.host_player_id is distinct from p_teacher then
    return jsonb_build_object('error', 'not_host');
  end if;
  if b.status <> 'lobby' then
    return jsonb_build_object('error', 'started');
  end if;
  select count(*) into v_students
    from public.battle_participants where battle_id = p_battle and left_at is null;
  if v_students < 1 then
    return jsonb_build_object('error', 'need_one');
  end if;

  v_hp := round(b.base_hp * (1 + b.hp_per_extra * (v_students - 1)))::integer;
  update public.battles
     set status = 'active', max_hp = v_hp, hp = v_hp, started_at = now(),
         next_attack_at = now() + make_interval(secs => attack_max_sec),
         deadline_at = now() + make_interval(secs => time_limit_sec)
   where id = p_battle;
  update public.battle_participants set question_issued_at = now()
   where battle_id = p_battle and left_at is null;
  return jsonb_build_object('ok', true, 'students', v_students, 'hp', v_hp);
end;
$$;

-- The teacher pauses, resumes or ends the class battle. A pause freezes
-- boss attacks, answers and the time limit; resuming shifts the attack
-- schedule and the deadline by the time spent paused.
create or replace function public.battle_control_class(p_battle uuid, p_teacher uuid, p_action text)
returns jsonb
language plpgsql as $$
declare
  b public.battles%rowtype;
begin
  -- Apply what was due before the pause (attacks, the time limit).
  perform public.battle_tick(p_battle);
  select * into b from public.battles where id = p_battle for update;
  if not found or b.mode <> 'class' then
    return jsonb_build_object('error', 'no_battle');
  end if;
  if b.host_player_id is distinct from p_teacher then
    return jsonb_build_object('error', 'not_host');
  end if;

  if p_action = 'pause' then
    if b.status <> 'active' then
      return jsonb_build_object('error', 'not_active');
    end if;
    update public.battles set status = 'paused', paused_at = now() where id = p_battle;
  elsif p_action = 'resume' then
    if b.status <> 'paused' then
      return jsonb_build_object('error', 'not_paused');
    end if;
    update public.battles
       set status = 'active',
           next_attack_at = next_attack_at + (now() - paused_at),
           deadline_at = deadline_at + (now() - paused_at),
           paused_at = null
     where id = p_battle;
  elsif p_action = 'end' then
    if b.status not in ('lobby', 'active', 'paused') then
      return jsonb_build_object('error', 'over');
    end if;
    update public.battles
       set status = 'ended', ended_at = now(), next_attack_at = null, paused_at = null
     where id = p_battle;
  else
    return jsonb_build_object('error', 'invalid');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- What the teacher sees: the battle and every student, after catching up.
-- Null unless p_teacher opened this class battle.
create or replace function public.battle_class_state(p_battle uuid, p_teacher uuid)
returns jsonb
language plpgsql as $$
begin
  if not exists (
    select 1 from public.battles
     where id = p_battle and mode = 'class' and host_player_id = p_teacher
  ) then
    return null;
  end if;
  perform public.battle_tick(p_battle);
  return (
    select jsonb_build_object(
      'battle', to_jsonb(b),
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
            'host', false,
            'me', false
          ) order by t.joined_at), '[]'::jsonb)
          from public.battle_participants t
          join public.players pl on pl.id = t.player_id
          left join public.player_pets tp on tp.id = t.pet_id
         where t.battle_id = b.id
      )
    )
      from public.battles b
     where b.id = p_battle
  );
end;
$$;

-- Leaving, as in 0005, plus class battles: in the lobby the student just
-- leaves; during the fight their pet steps out (its HP is kept for when
-- they come back), they get no rewards meanwhile, and the class fights on.
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

  if b.mode = 'class' then
    if b.status = 'lobby' then
      delete from public.battle_participants where battle_id = p_battle and player_id = p_player;
      return found;
    end if;
    if b.status in ('active', 'paused') then
      update public.battle_participants
         set left_at = now(), left_pet_hp = pet_hp, pet_hp = 0
       where battle_id = p_battle and player_id = p_player and left_at is null;
      return found;
    end if;
    return false;
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

-- The tick from 0002, except that a class battle with nobody in the room
-- (everyone stepped out) isn't lost: the class can come back. It is lost
-- when every student who is there has fainted.
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
    ) and (
      b.mode <> 'class'
      or exists (select 1 from public.battle_participants where battle_id = p_battle and left_at is null)
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

-- Only the server (service role) may call these.
revoke execute on function public.battle_create_class(uuid, text, text, integer, numeric, integer, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.battle_join_group(text, uuid, uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.battle_start_class(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.battle_control_class(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.battle_class_state(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.battle_leave(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.battle_tick(uuid) from public, anon, authenticated;
grant execute on function public.battle_create_class(uuid, text, text, integer, numeric, integer, integer, integer, integer) to service_role;
grant execute on function public.battle_join_group(text, uuid, uuid, integer, text) to service_role;
grant execute on function public.battle_start_class(uuid, uuid) to service_role;
grant execute on function public.battle_control_class(uuid, uuid, text) to service_role;
grant execute on function public.battle_class_state(uuid, uuid) to service_role;
grant execute on function public.battle_leave(uuid, uuid) to service_role;
grant execute on function public.battle_tick(uuid) to service_role;
