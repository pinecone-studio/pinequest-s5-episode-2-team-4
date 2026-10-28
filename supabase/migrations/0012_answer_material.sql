-- Material a teacher adds to a group answer: a section of a lesson in the
-- app or an outside link (AnswerMaterial in src/lib/types.ts). The students'
-- copy lives in anon_questions.answer, which is already jsonb.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again.

alter table public.question_groups
  add column if not exists material jsonb;
