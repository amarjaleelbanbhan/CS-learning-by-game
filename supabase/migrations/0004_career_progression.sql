-- Engineer Career System persistence (PROMPT 05).
--
-- Only PERSISTENT progression lives here, per the offline-first design: rank,
-- department reputation, certifications, blueprints, laboratory tier, statistics
-- snapshot, and a career-history log. RX/EC remain `profiles.xp`/`profiles.coins`
-- (unchanged) — "RX"/"EC" are presentation names for those existing columns, not new
-- columns, so no migration of that data was needed.
create table if not exists public.career_progress (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  rank_id                 text not null default 'cadet-engineer',
  department_reputation   jsonb not null default '{}'::jsonb,
  certifications          text[] not null default '{}',
  blueprints              text[] not null default '{}',
  boss_victories          text[] not null default '{}',
  lab_tier                int  not null default 1,
  statistics              jsonb not null default '{}'::jsonb,
  updated_at              timestamptz not null default now()
);

-- Append-only career history (promotions, certifications earned, blueprints unlocked) —
-- separate from the snapshot above so the Engineer Console can render a timeline.
create table if not exists public.career_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  event_type  text not null check (event_type in ('promotion', 'certification', 'blueprint', 'boss_victory')),
  event_id    text not null,
  occurred_at timestamptz not null default now()
);
create index if not exists career_history_user_idx on public.career_history (user_id, occurred_at desc);

drop trigger if exists career_progress_set_updated_at on public.career_progress;
create trigger career_progress_set_updated_at
  before update on public.career_progress
  for each row execute function public.set_updated_at();

alter table public.career_progress enable row level security;
alter table public.career_history  enable row level security;

create policy "career progress self all" on public.career_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "career history self all" on public.career_history for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
