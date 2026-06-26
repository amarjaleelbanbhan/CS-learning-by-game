-- Project ARC Reactor — initial schema
-- Identity, progress, gamification, practice, and analytics.
--
-- Security model (OWASP / least privilege):
--   * RLS is enabled on every table; users can only read/write their OWN rows.
--   * Content tables (achievements) are world-readable, writable only by the
--     service role (no anon/auth policy granting writes).
--   * Authoritative mutations (XP/coins/mission rewards) are performed by the
--     server using the service-role key with server-validated amounts — never
--     trusted from the client. The self-write policies below cover only
--     low-stakes, user-owned data (profile prefs, attempts, events).

-- ---------------------------------------------------------------------------
-- Identity / profile
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text not null default 'Recruit',
  avatar_url     text,
  level          int  not null default 1,
  xp             int  not null default 0,
  coins          int  not null default 0,
  current_streak int  not null default 0,
  longest_streak int  not null default 0,
  last_active    date,
  prefs          jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Progress
-- ---------------------------------------------------------------------------
create table if not exists public.mission_progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  mission_id   text not null,
  status       text not null default 'available'
                 check (status in ('locked', 'available', 'in_progress', 'completed')),
  stage_state  jsonb not null default '{}'::jsonb,
  score        numeric,
  attempts     int   not null default 0,
  started_at   timestamptz,
  completed_at timestamptz,
  primary key (user_id, mission_id)
);
create index if not exists mission_progress_user_idx on public.mission_progress (user_id);

create table if not exists public.topic_mastery (
  user_id          uuid not null references auth.users (id) on delete cascade,
  topic_id         text not null,
  mastery          numeric not null default 0,           -- 0..1
  last_reviewed_at timestamptz,
  due_at           timestamptz,
  primary key (user_id, topic_id)
);
create index if not exists topic_mastery_due_idx on public.topic_mastery (user_id, due_at);

-- ---------------------------------------------------------------------------
-- Gamification
-- ---------------------------------------------------------------------------
create table if not exists public.achievements (
  id          text primary key,
  title       text not null,
  description text not null,
  icon        text,
  rule        jsonb not null default '{}'::jsonb
);

create table if not exists public.user_achievements (
  user_id        uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null references public.achievements (id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------------------------------------------------------------------------
-- Practice / assessment
-- ---------------------------------------------------------------------------
create table if not exists public.problem_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  topic_id   text not null,
  problem    jsonb not null,
  answer     jsonb,
  correct    boolean not null default false,
  hints_used int not null default 0,
  time_ms    int,
  created_at timestamptz not null default now()
);
create index if not exists problem_attempts_user_idx on public.problem_attempts (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Analytics (append-only event log)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id      bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  type    text not null,
  payload jsonb not null default '{}'::jsonb,
  ts      timestamptz not null default now()
);
create index if not exists events_user_ts_idx on public.events (user_id, ts desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Recruit')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.mission_progress  enable row level security;
alter table public.topic_mastery     enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;
alter table public.problem_attempts  enable row level security;
alter table public.events            enable row level security;

-- profiles: a user sees and edits only their own row.
create policy "profiles self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- mission_progress / topic_mastery / user_achievements / problem_attempts /
-- events: full self access (read + write own rows). Authoritative reward
-- amounts are still validated server-side; these policies just scope ownership.
create policy "mp self all" on public.mission_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tm self all" on public.topic_mastery for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ua self all" on public.user_achievements for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pa self all" on public.problem_attempts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ev self all" on public.events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- achievements: world-readable catalog; writes restricted to service role
-- (no insert/update/delete policy is defined for anon/authenticated).
create policy "achievements public read" on public.achievements for select using (true);
