-- Understanding signals (🟢 got it, 🟡 unsure, 🔴 lost) that students send
-- beside a lesson; the teacher sees today's counts for their class.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again.
--
-- Row-level security is on with no policies, so only the server
-- (service-role key) can read or write. No student id or name is stored:
-- `voter` is an HMAC of the student id, subtopic and day, so a student can
-- change their answer but signals can't be traced to them or across lessons.

create table if not exists public.understanding_signals (
  id uuid primary key default gen_random_uuid(),
  class_code text not null,
  subtopic_id text not null,
  -- The lesson day in Ulaanbaatar time.
  day date not null,
  voter text not null,
  level text not null check (level in ('got', 'unsure', 'lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_code, subtopic_id, day, voter)
);

create index if not exists understanding_signals_class_day
  on public.understanding_signals (class_code, day);

alter table public.understanding_signals enable row level security;
