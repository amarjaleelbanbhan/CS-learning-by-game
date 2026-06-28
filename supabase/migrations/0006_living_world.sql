-- Living World persistence (PROMPT 07).
--
-- Only MEANINGFUL world state lives here, per the offline-first design: NPC
-- relationships/memory, unlocked lab decorations, and world events already mentioned by
-- ARIA. The active world event itself, which NPCs are currently unlocked, and the
-- player's current rank/reputation are all DERIVED at read time from career_progress +
-- the clock (engine-world's pure functions) — never duplicated into storage here.
create table if not exists public.world_state (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  npc_relationships    jsonb not null default '{}'::jsonb,
  npc_memory           jsonb not null default '{}'::jsonb,
  unlocked_decorations text[] not null default '{}',
  mentioned_world_events text[] not null default '{}',
  current_district     text,
  updated_at           timestamptz not null default now()
);

drop trigger if exists world_state_set_updated_at on public.world_state;
create trigger world_state_set_updated_at
  before update on public.world_state
  for each row execute function public.set_updated_at();

alter table public.world_state enable row level security;

create policy "world state self all" on public.world_state for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
