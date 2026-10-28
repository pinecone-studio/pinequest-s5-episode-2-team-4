-- Failed logins, to stop password guessing (src/lib/login-limit.ts): after 5
-- wrong logins for a username within 15 minutes, it can't log in for 15
-- minutes.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again.
--
-- Row-level security is on with no policies, so only the server
-- (service-role key) can read or write.

create table if not exists public.login_failures (
  id bigint generated always as identity primary key,
  -- The lowercased username, also for names with no account, so a block
  -- doesn't reveal which names exist.
  username_key text not null,
  failed_at timestamptz not null default now()
);
create index if not exists login_failures_username_idx on public.login_failures (username_key, failed_at desc);
create index if not exists login_failures_failed_at_idx on public.login_failures (failed_at);

alter table public.login_failures enable row level security;
