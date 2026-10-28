-- Anonymous questions students ask beside a lesson, and the groups of
-- similar questions a teacher answers once.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again.
--
-- Row-level security is on with no policies, so only the server
-- (service-role key) can read or write. No student id or name is stored
-- with a question: the questions are anonymous even to the database.

create table if not exists public.question_groups (
  id uuid primary key default gen_random_uuid(),
  -- Groups never mix classes or lessons.
  class_code text not null,
  subtopic_id text not null,
  title text not null check (char_length(title) between 1 and 120),
  status text not null default 'pending' check (status in ('pending', 'answered')),
  answer text,
  -- Who made the group: the AI, the rules fallback, or the teacher.
  source text not null default 'ai' check (source in ('ai', 'rules', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists question_groups_lesson
  on public.question_groups (class_code, subtopic_id);

create table if not exists public.anon_questions (
  id uuid primary key default gen_random_uuid(),
  class_code text not null,
  subtopic_id text not null,
  -- Exactly what the student typed; never rewritten.
  text text not null check (char_length(text) between 1 and 500),
  -- Lowercased with punctuation and extra spaces removed, only to spot duplicates.
  normalized text not null,
  me_too integer not null default 0 check (me_too >= 0),
  group_id uuid references public.question_groups (id) on delete set null,
  -- AI classification: pending until done; failed ones are retried.
  classify_status text not null default 'pending'
    check (classify_status in ('pending', 'done', 'failed')),
  classify_attempts integer not null default 0,
  topic text,
  intent text,
  misconception text,
  needs_review boolean,
  -- The answer shown to the class (QuestionAnswer in src/lib/types.ts).
  answer jsonb,
  created_at timestamptz not null default now()
);

create index if not exists anon_questions_lesson
  on public.anon_questions (class_code, subtopic_id, created_at desc);
create index if not exists anon_questions_duplicates
  on public.anon_questions (class_code, subtopic_id, normalized);

alter table public.question_groups enable row level security;
alter table public.anon_questions enable row level security;
