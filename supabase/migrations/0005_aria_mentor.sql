-- ARIA Mentor System persistence (PROMPT 06).
--
-- Offline-first: gameplay and mentoring never wait on the network. These tables are a
-- write-through mirror of the localStorage mentor store so a player's long-term memory,
-- milestones, and coaching preferences survive across devices. Only the data ARIA is
-- allowed to "remember" lives here — all of it traceable to real events the client
-- recorded; ARIA never fabricates memory.

-- One row per player: coaching preferences + a compact long-term memory snapshot.
create table if not exists public.mentor_state (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  mentor_mode      text not null default 'encouraging'
                     check (mentor_mode in ('encouraging','analytical','minimal','competitive','patient')),
  auto_mode        boolean not null default true,
  session_count    int not null default 0,
  last_visit_at    timestamptz,
  -- Milestones already celebrated (so ARIA never celebrates the same one twice) and the
  -- Socratic ladder position per misconception id.
  celebrated_milestones text[] not null default '{}',
  socratic_progress jsonb not null default '{}'::jsonb,
  updated_at       timestamptz not null default now()
);

-- Append-only mentor event log (mission outcomes, mistakes, hints, milestones) — the raw
-- material for long-term memory and "three weeks ago you couldn't…" callbacks.
create table if not exists public.mentor_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  event_type  text not null,
  ref_id      text,
  label       text,
  occurred_at timestamptz not null default now()
);
create index if not exists mentor_events_user_idx on public.mentor_events (user_id, occurred_at desc);

-- Optional conversation history (stored only when appropriate / player-visible coaching).
create table if not exists public.mentor_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  intent      text not null,
  text        text not null,
  occurred_at timestamptz not null default now()
);
create index if not exists mentor_conversations_user_idx
  on public.mentor_conversations (user_id, occurred_at desc);

drop trigger if exists mentor_state_set_updated_at on public.mentor_state;
create trigger mentor_state_set_updated_at
  before update on public.mentor_state
  for each row execute function public.set_updated_at();

alter table public.mentor_state         enable row level security;
alter table public.mentor_events        enable row level security;
alter table public.mentor_conversations enable row level security;

create policy "mentor state self all" on public.mentor_state for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mentor events self all" on public.mentor_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mentor conversations self all" on public.mentor_conversations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
