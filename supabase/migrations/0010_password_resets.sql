-- Password reset links (src/lib/password-reset.ts): "Нууц үг мартсан?" emails
-- a link that sets a new password. Each link works once, for 30 minutes.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again.
--
-- Row-level security is on with no policies, so only the server
-- (service-role key) can read or write.

create table if not exists public.password_resets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  -- SHA-256 of the token in the link; the token itself is never stored.
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
-- Recent links per account, for the "3 emails an hour" limit.
create index if not exists password_resets_account_idx on public.password_resets (account_id, created_at desc);

alter table public.password_resets enable row level security;
