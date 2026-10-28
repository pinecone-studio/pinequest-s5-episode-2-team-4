-- Teacher content: uploaded lesson materials, lesson videos (reels) and game
-- assignments with their questions and students' attempts.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again.
--
-- Row-level security is on with no policies, so only the server
-- (service-role key) can read or write, like the other tables. Files live in
-- two private Storage buckets; the server hands out signed URLs.

-- A teacher's lesson material: a topic, text and uploaded files, plus what
-- the AI recognised in it after the teacher's edits.
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.accounts (id) on delete cascade,
  class_code text,
  grade int,
  subject text not null default 'math',
  topic_title text not null check (char_length(topic_title) between 1 and 120),
  text_content text check (char_length(text_content) <= 20000),
  -- [{ path, mime, size, name }] in the materials bucket
  files jsonb not null default '[]'::jsonb,
  -- { topic, concepts, examples, mistakes, formulas } (Recognition in src/lib/types.ts)
  extraction jsonb,
  created_at timestamptz not null default now()
);
create index if not exists materials_teacher_idx on public.materials (teacher_id, created_at desc);

-- A short vertical lesson video, played in the browser from its script,
-- narration audio and word timings (no rendered video file).
create table if not exists public.lesson_videos (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.accounts (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  class_code text not null,
  title text not null check (char_length(title) between 1 and 120),
  status text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  -- { sections: [{ kind, say, caption, formula? }] } (ReelScript)
  script jsonb not null,
  -- Textbook-style explanation students can read instead of watching.
  book jsonb,
  -- Path in the lesson-audio bucket; null when narrated without audio.
  audio_path text,
  -- { words: [{ text, start, end }], sections: [{ start, end }], duration } in ms
  timings jsonb,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lesson_videos_class_idx on public.lesson_videos (class_code, status);
create index if not exists lesson_videos_teacher_idx on public.lesson_videos (teacher_id, updated_at desc);

-- Homework played through the games.
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.accounts (id) on delete cascade,
  class_code text not null,
  title text not null check (char_length(title) between 1 and 120),
  subject text not null default 'math',
  material_id uuid references public.materials (id) on delete set null,
  -- Game ids students may play it with, e.g. {snake,race}.
  games text[] not null default '{}',
  -- 'fixed': the games above; 'interest': each student's favourite of them.
  game_mode text not null default 'fixed' check (game_mode in ('fixed', 'interest')),
  -- 'class': everyone; 'weak': students weak in target_subtopic_id.
  target text not null default 'class' check (target in ('class', 'weak')),
  target_subtopic_id text,
  due_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists assignments_class_idx on public.assignments (class_code, status);
create index if not exists assignments_teacher_idx on public.assignments (teacher_id, created_at desc);

-- One round of an assignment, the same shape as GameQuestion.
create table if not exists public.assignment_questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  position int not null,
  prompt text not null check (char_length(prompt) between 1 and 200),
  correct jsonb not null,
  wrong jsonb not null,
  explanation text not null default ''
);
create index if not exists assignment_questions_idx on public.assignment_questions (assignment_id, position);

-- A finished game session of an assignment.
create table if not exists public.assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.accounts (id) on delete cascade,
  game text not null,
  score int not null default 0,
  accuracy int not null default 0 check (accuracy between 0 and 100),
  stars int not null default 1 check (stars between 1 and 3),
  best_combo int not null default 0,
  missed_question_ids uuid[] not null default '{}',
  xp_awarded int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists assignment_attempts_idx on public.assignment_attempts (assignment_id, student_id);

alter table public.materials enable row level security;
alter table public.lesson_videos enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_questions enable row level security;
alter table public.assignment_attempts enable row level security;

-- Private buckets: uploads (images, PDF, text) and narration audio.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('materials', 'materials', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']),
  ('lesson-audio', 'lesson-audio', false, 10485760, array['audio/mpeg'])
on conflict (id) do nothing;

-- Let the API see the new tables right away.
notify pgrst, 'reload schema';
