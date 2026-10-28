-- Classes a teacher creates and the students in them, replacing the class
-- code students typed at sign-up. Each teacher has their own classes, in the
-- subject they teach; a student can be in several (one per subject teacher).
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again.
--
-- Row-level security is on with no policies, so only the server
-- (service-role key) can read or write.

-- Students can be added by phone as well as email.
alter table public.accounts add column if not exists phone text;
create unique index if not exists accounts_phone_key
  on public.accounts (phone) where phone is not null;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  -- The key the class's assignments, videos, questions and signals use
  -- (their class_code), e.g. "7А-4821". accounts.class_code holds the class
  -- a user is working in now.
  code text not null unique,
  -- What the teacher calls it, e.g. "7А".
  name text not null check (char_length(name) between 1 and 5),
  teacher_id uuid not null references public.accounts (id) on delete cascade,
  -- The teacher's subject (src/lib/subjects.ts id).
  subject text not null,
  grade smallint not null default 7,
  created_at timestamptz not null default now()
);

create index if not exists classes_teacher on public.classes (teacher_id);

create table if not exists public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.accounts (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create index if not exists class_members_student on public.class_members (student_id);

-- QR invites: valid only while the teacher shows the code. The open QR
-- pushes expires_at forward every few seconds; closing it deletes the row.
create table if not exists public.class_invites (
  token text primary key,
  class_id uuid not null references public.classes (id) on delete cascade,
  expires_at timestamptz not null
);

create index if not exists class_invites_class on public.class_invites (class_id);

-- Existing class codes become classes: the first teacher with a code owns it,
-- and students who typed that code join it.
insert into public.classes (code, name, teacher_id, subject)
select distinct on (class_code) class_code, left(class_code, 5), id, coalesce(progress ->> 'subject', 'math')
from public.accounts
where role = 'teacher' and not demo and class_code is not null
order by class_code, created_at
on conflict (code) do nothing;

insert into public.class_members (class_id, student_id)
select c.id, a.id
from public.accounts a
join public.classes c on c.code = a.class_code
where a.role = 'student' and not a.demo
on conflict do nothing;

alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.class_invites enable row level security;
