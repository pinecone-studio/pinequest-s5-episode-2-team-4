-- Boss battles about any subject, not only English. The battle remembers
-- its subject; the questions themselves live in the code.

alter table public.battles add column if not exists subject text not null default 'eng';

-- Answers to other subjects are kept per question too, as skill 'subject'.
-- English progress only sums its four skills, so they don't mix in.
alter table public.english_progress drop constraint if exists english_progress_skill_check;
alter table public.english_progress add constraint english_progress_skill_check
  check (skill in ('grammar', 'pronunciation', 'spelling', 'translation', 'subject'));

-- Let the API see the new column right away.
notify pgrst, 'reload schema';
