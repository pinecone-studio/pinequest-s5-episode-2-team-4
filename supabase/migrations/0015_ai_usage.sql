-- What each AI (Claude) call cost, for the monthly budget in src/lib/ai/budget.ts.
-- Server only, like every other table: RLS on, no policies.

create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_created_idx on public.ai_usage (created_at);

alter table public.ai_usage enable row level security;

-- Let the API see the new table right away.
notify pgrst, 'reload schema';
