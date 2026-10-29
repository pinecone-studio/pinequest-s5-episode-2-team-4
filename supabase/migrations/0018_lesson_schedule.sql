-- Lesson schedule: the weekdays a class has the lesson, and the topic planned
-- for a lesson day. Students get «Ойлгосон уу?» on lesson days even when the
-- teacher doesn't open the app that day.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again.

-- ISO weekdays: 1 = Monday … 7 = Sunday.
alter table public.classes add column if not exists lesson_days smallint[] not null default '{}';

-- One topic per class and day. topic_key is the key signals use: a Grade 7
-- curriculum lesson ("m7.2.3") or the teacher's own topic ("t:<title>").
create table if not exists public.lesson_plans (
  class_id uuid not null references public.classes (id) on delete cascade,
  day date not null,
  topic_key text not null,
  topic_title text not null check (char_length(topic_title) between 1 and 120),
  updated_at timestamptz not null default now(),
  primary key (class_id, day)
);

-- Only the server (service-role key) reads or writes, like every other table.
alter table public.lesson_plans enable row level security;

-- Let the API see the new column and table right away.
notify pgrst, 'reload schema';
