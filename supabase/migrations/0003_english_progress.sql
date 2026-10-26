-- English progress: every battle answer also updates the player's progress
-- for that question, and the next question leans towards weaker skills.
--
-- Run in the Supabase dashboard after 0002: SQL Editor → New query →
-- paste → Run. Safe to run again.

-- Recent mistakes and per-skill totals read a player's rows by time.
create index if not exists english_progress_recent
  on public.english_progress (player_id, last_answered_at desc);

-- 0002's version didn't record progress or weight questions by skill.
drop function if exists public.battle_answer(uuid, text, text, uuid, text, boolean, integer, integer, text[]);

-- Applies one answer, records English progress and picks the next question,
-- in one round trip. Same rules as 0002 otherwise: p_damage is the base
-- damage (combo bonus added here); only the asked question for this boss
-- counts; a repeated attempt id changes nothing.
create or replace function public.battle_answer(
  p_battle uuid,
  p_boss text,
  p_username text,
  p_attempt uuid,
  p_question text,
  p_correct boolean,
  p_damage integer,
  p_pet_damage integer,
  p_next_candidates text[],
  p_unit text,
  p_skill text,
  p_candidate_skills text[]
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

  insert into public.battle_answers (
    battle_id, player_id, attempt_id, question_id, correct, damage, pet_damage
  ) values (
    p_battle, v_player, p_attempt, p_question, p_correct, v_damage, v_pet_damage
  );

  -- English progress for this question, in the same transaction.
  insert into public.english_progress (
    player_id, question_id, unit_id, skill, attempts, correct, last_correct, last_answered_at
  ) values (
    v_player, p_question, p_unit, p_skill, 1, case when p_correct then 1 else 0 end, p_correct, now()
  )
  on conflict (player_id, question_id) do update
    set attempts = public.english_progress.attempts + 1,
        correct = public.english_progress.correct + excluded.correct,
        last_correct = excluded.last_correct,
        last_answered_at = excluded.last_answered_at,
        unit_id = excluded.unit_id,
        skill = excluded.skill;

  -- Next question: not one of the last 8 asked, and more likely from the
  -- player's weaker skills. Weight = 1 + 2 × (1 − accuracy), so a skill at
  -- 0% comes up 3× as often as one at 100%; unseen skills count as 75%.
  -- Every skill keeps a chance, so nothing is locked out.
  with accuracy as (
    select skill, sum(correct)::numeric / nullif(sum(attempts), 0) as value
      from public.english_progress
     where player_id = v_player
     group by skill
  ), recent as (
    select question_id from public.battle_answers
     where battle_id = p_battle and player_id = v_player
     order by id desc
     limit 8
  )
  select t.c into v_next
    from unnest(p_next_candidates, p_candidate_skills) as t(c, skill)
    left join accuracy a on a.skill = t.skill
   where t.c <> p_question
     and t.c not in (select question_id from recent)
   order by power(random(), 1.0 / (1 + 2 * (1 - coalesce(a.value, 0.75)))) desc
   limit 1;
  v_next := coalesce(v_next, p_next_candidates[1], p_question);

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

revoke execute on function public.battle_answer(uuid, text, text, uuid, text, boolean, integer, integer, text[], text, text, text[]) from public, anon, authenticated;
grant execute on function public.battle_answer(uuid, text, text, uuid, text, boolean, integer, integer, text[], text, text, text[]) to service_role;
