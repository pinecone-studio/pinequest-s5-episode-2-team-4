-- LevelUp game state: English boss battles, pets, eggs and English progress.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again: everything uses "if not exists".
--
-- Row-level security is on for every table with no policies, so only the
-- server (service-role key) can read or write. Later migrations add
-- read-only policies where the browser needs live battle updates.

-- Players: one row per LevelUp account that has played a boss battle.
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  role text not null default 'student' check (role in ('student', 'teacher')),
  class_code text,
  exp integer not null default 0 check (exp >= 0),
  level integer not null default 1 check (level >= 1),
  coins integer not null default 0 check (coins >= 0),
  created_at timestamptz not null default now()
);
-- Usernames match case-insensitively, like the login.
create unique index if not exists players_username_key on public.players (lower(username));

-- Pets a player owns (one row per pet line; duplicates become rewards).
create table if not exists public.player_pets (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  line_id text not null,
  level integer not null default 1 check (level >= 1),
  exp integer not null default 0 check (exp >= 0),
  max_hp integer not null default 100 check (max_hp > 0),
  is_active boolean not null default false,
  obtained_at timestamptz not null default now(),
  unique (player_id, line_id)
);
-- At most one active pet per player.
create unique index if not exists player_pets_one_active
  on public.player_pets (player_id) where is_active;

-- Battles: solo, group or whole-class, against one boss.
create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  boss_id text not null,
  mode text not null check (mode in ('solo', 'group', 'class')),
  status text not null default 'lobby'
    check (status in ('lobby', 'active', 'paused', 'won', 'lost', 'ended')),
  -- Code friends or a class use to join (group and class battles).
  join_code text unique,
  class_code text,
  host_player_id uuid references public.players (id) on delete set null,
  max_hp integer not null check (max_hp > 0),
  hp integer not null check (hp >= 0 and hp <= max_hp),
  -- Boss attacks happen on a server-set schedule; attack_count says how
  -- many have been applied, so each one is applied exactly once.
  attack_count integer not null default 0 check (attack_count >= 0),
  next_attack_at timestamptz,
  paused_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists battles_status on public.battles (status);

-- Who is in a battle, with their pet's HP and contribution.
create table if not exists public.battle_participants (
  battle_id uuid not null references public.battles (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  pet_id uuid references public.player_pets (id) on delete set null,
  pet_hp integer not null check (pet_hp >= 0),
  pet_max_hp integer not null check (pet_max_hp > 0),
  damage_dealt integer not null default 0 check (damage_dealt >= 0),
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  combo integer not null default 0,
  best_combo integer not null default 0,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  -- Set when this player's victory rewards were granted (only once).
  rewarded_at timestamptz,
  primary key (battle_id, player_id)
);

-- Every answer in a battle. attempt_id comes from the browser per submit,
-- so a double click or retry can't apply the same answer twice.
create table if not exists public.battle_answers (
  id bigint generated always as identity primary key,
  battle_id uuid not null references public.battles (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  attempt_id uuid not null,
  question_id text not null,
  correct boolean not null,
  damage integer not null default 0,
  pet_damage integer not null default 0,
  created_at timestamptz not null default now(),
  unique (battle_id, player_id, attempt_id)
);

-- Eggs won from bosses. The pet line is decided on the server when the egg
-- is granted; at most one egg per player per battle.
create table if not exists public.eggs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  battle_id uuid references public.battles (id) on delete set null,
  boss_id text not null,
  line_id text not null,
  rarity text not null check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  obtained_at timestamptz not null default now(),
  hatched_at timestamptz,
  unique (battle_id, player_id)
);

-- English progress per question; totals per skill and unit are summed from it.
create table if not exists public.english_progress (
  player_id uuid not null references public.players (id) on delete cascade,
  question_id text not null,
  unit_id text not null,
  skill text not null check (skill in ('grammar', 'pronunciation', 'spelling', 'translation')),
  attempts integer not null default 0 check (attempts >= 0),
  correct integer not null default 0 check (correct >= 0 and correct <= attempts),
  last_correct boolean,
  last_answered_at timestamptz not null default now(),
  primary key (player_id, question_id)
);

alter table public.players enable row level security;
alter table public.player_pets enable row level security;
alter table public.battles enable row level security;
alter table public.battle_participants enable row level security;
alter table public.battle_answers enable row level security;
alter table public.eggs enable row level security;
alter table public.english_progress enable row level security;
