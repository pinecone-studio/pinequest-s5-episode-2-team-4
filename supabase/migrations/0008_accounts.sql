-- LevelUp accounts, replacing the mock accounts cookie: who can log in, and
-- their learning progress.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again.
--
-- Row-level security is on with no policies, so only the server
-- (service-role key) can read or write. Passwords are scrypt hashes made by
-- the server (src/lib/accounts.ts), never plain text.

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null check (char_length(username) between 1 and 40),
  -- Lowercase. Only throwaway demo accounts have no email or password.
  email text check (email = lower(email)),
  password_hash text,
  role text not null default 'student' check (role in ('student', 'teacher')),
  class_code text,
  -- Pet, test answers, practice, mastered subtopics, the latest retest and
  -- the streak (AccountProgress in src/lib/accounts.ts).
  progress jsonb not null default '{}'::jsonb,
  -- A demo account can't be logged into; every other account can.
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  constraint accounts_can_log_in check (demo or (email is not null and password_hash is not null))
);
-- Usernames match case-insensitively, like players.username.
create unique index if not exists accounts_username_key on public.accounts (lower(username));
create unique index if not exists accounts_email_key on public.accounts (email);

alter table public.accounts enable row level security;
