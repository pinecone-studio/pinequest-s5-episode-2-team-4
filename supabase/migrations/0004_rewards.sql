-- Rewards and pet collection: victory EXP and eggs (granted once), hatching,
-- owned pets with levels, and choosing the active battle pet.
--
-- Run in the Supabase dashboard after 0003: SQL Editor → New query →
-- paste → Run. Safe to run again.

-- What each player got from a battle, shown on the result screen.
alter table public.battle_participants
  add column if not exists reward_exp integer,
  add column if not exists reward_pet_exp integer,
  add column if not exists reward_egg_line text,
  add column if not exists reward_egg_rarity text;

-- Pets level up every 100 EXP (evolving at levels 3 and 6, like LevelUp);
-- battle HP is 100 + 10 × level.
create or replace function public.game_add_pet_exp(p_pet uuid, p_exp integer)
returns void
language sql as $$
  -- Right-hand sides see the row before this update.
  update public.player_pets
     set level = level + (exp + p_exp) / 100,
         exp = (exp + p_exp) % 100,
         max_hp = 100 + 10 * (level + (exp + p_exp) / 100)
   where id = p_pet;
$$;

-- The pet the player fights with. Their LevelUp account's pet is the
-- starter: always owned, its level kept in step with the account. If no
-- pet is active yet, the starter is.
create or replace function public.game_battle_pet(
  p_player uuid, p_starter_line text, p_starter_level integer
) returns jsonb
language plpgsql as $$
declare
  v_pet jsonb;
begin
  insert into public.player_pets (player_id, line_id, level, max_hp, is_active)
  values (
    p_player, p_starter_line, p_starter_level, 100 + 10 * p_starter_level,
    not exists (select 1 from public.player_pets where player_id = p_player and is_active)
  )
  on conflict (player_id, line_id) do update
    set level = greatest(public.player_pets.level, excluded.level),
        max_hp = 100 + 10 * greatest(public.player_pets.level, excluded.level);

  if not exists (select 1 from public.player_pets where player_id = p_player and is_active) then
    update public.player_pets set is_active = true
     where player_id = p_player and line_id = p_starter_line;
  end if;

  select jsonb_build_object('id', id, 'line_id', line_id, 'level', level, 'max_hp', max_hp)
    into v_pet
    from public.player_pets
   where player_id = p_player and is_active;
  return v_pet;
end;
$$;

-- 0002/0003 always made the account's pet active; game_battle_pet replaces it.
drop function if exists public.game_active_pet(uuid, text, integer, integer);

-- The battle view now includes the fighting pet (its line and level).
create or replace function public.battle_view(p_battle uuid, p_player uuid)
returns jsonb
language sql stable as $$
  select jsonb_build_object('battle', to_jsonb(b), 'me', to_jsonb(p), 'pet', to_jsonb(pp), 'now', now())
    from public.battles b
    join public.battle_participants p on p.battle_id = b.id and p.player_id = p_player
    left join public.player_pets pp on pp.id = p.pet_id
   where b.id = p_battle;
$$;

-- Grants a won battle's rewards to this player exactly once: player EXP
-- (a level every 100), EXP for the pet that fought, and an egg if the app
-- rolled one (its pet line decided by the app from the boss's egg pool).
-- Returns { ok } or { error }; a second call changes nothing.
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

-- Hatches one of the player's eggs. A new pet joins the collection at level
-- 1; a pet line they already own gives that pet p_duplicate_exp instead.
create or replace function public.egg_hatch(p_egg uuid, p_username text, p_duplicate_exp integer)
returns jsonb
language plpgsql as $$
declare
  v_player uuid;
  e public.eggs%rowtype;
  v_pet uuid;
begin
  select id into v_player from public.players where lower(username) = lower(p_username);
  select * into e from public.eggs where id = p_egg and player_id = v_player for update;
  if not found then
    return jsonb_build_object('error', 'no_egg');
  end if;
  if e.hatched_at is not null then
    return jsonb_build_object('error', 'already_hatched');
  end if;

  update public.eggs set hatched_at = now() where id = p_egg;

  select id into v_pet from public.player_pets where player_id = v_player and line_id = e.line_id;
  if v_pet is not null then
    perform public.game_add_pet_exp(v_pet, greatest(p_duplicate_exp, 0));
  else
    insert into public.player_pets (player_id, line_id, level, max_hp)
    values (v_player, e.line_id, 1, 110);
  end if;

  return jsonb_build_object(
    'line_id', e.line_id,
    'rarity', e.rarity,
    'duplicate', v_pet is not null,
    'bonus_exp', case when v_pet is not null then greatest(p_duplicate_exp, 0) else 0 end
  );
end;
$$;

-- Makes one of the player's own pets the one they fight with. Returns false
-- (and changes nothing) for a pet line they don't own.
create or replace function public.game_set_active_pet(p_username text, p_line text)
returns boolean
language plpgsql as $$
declare
  v_player uuid;
begin
  select id into v_player from public.players where lower(username) = lower(p_username);
  if not exists (
    select 1 from public.player_pets where player_id = v_player and line_id = p_line
  ) then
    return false;
  end if;
  update public.player_pets set is_active = false
   where player_id = v_player and is_active and line_id <> p_line;
  update public.player_pets set is_active = true
   where player_id = v_player and line_id = p_line;
  return true;
end;
$$;

-- Only the server (service role) may call these.
revoke execute on function public.game_add_pet_exp(uuid, integer) from public, anon, authenticated;
revoke execute on function public.game_battle_pet(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.battle_view(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.battle_claim_rewards(uuid, text, integer, integer, text, text) from public, anon, authenticated;
revoke execute on function public.egg_hatch(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.game_set_active_pet(text, text) from public, anon, authenticated;
grant execute on function public.game_add_pet_exp(uuid, integer) to service_role;
grant execute on function public.game_battle_pet(uuid, text, integer) to service_role;
grant execute on function public.battle_view(uuid, uuid) to service_role;
grant execute on function public.battle_claim_rewards(uuid, text, integer, integer, text, text) to service_role;
grant execute on function public.egg_hatch(uuid, text, integer) to service_role;
grant execute on function public.game_set_active_pet(text, text) to service_role;
