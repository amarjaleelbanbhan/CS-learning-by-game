/**
 * Mentor memory — ARIA's persistent recollection of the player's journey.
 *
 * This is a pure data model + reducers. The host persists it (localStorage + Supabase),
 * but the logic for what ARIA remembers and how it's queried lives here so it's testable
 * without a browser and reusable across subjects.
 *
 * CRITICAL: memory only ever stores things that genuinely happened (events the host
 * recorded from real engine state). ARIA never fabricates memory — if it isn't in here,
 * ARIA doesn't claim it.
 */

export type MentorEventType =
  | 'mission-completed'
  | 'mission-failed'
  | 'mistake-made'
  | 'hint-used'
  | 'visualization-used'
  | 'certification-earned'
  | 'promotion'
  | 'boss-victory'
  | 'session-start'
  | 'socratic-step-shown'
  | 'milestone-celebrated';

export interface MentorEvent {
  readonly type: MentorEventType;
  /** Epoch milliseconds. */
  readonly at: number;
  /** Mission id, concept id, misconception id, rank id, etc. — depends on type. */
  readonly refId?: string;
  /** Free-form small payload (e.g. concept label) — never trusted as the source of numbers. */
  readonly label?: string;
}

export interface MentorMemory {
  readonly events: readonly MentorEvent[];
  /** Epoch ms of the most recent session-start before the current one; null if none. */
  readonly lastVisitAt: number | null;
  /** How many distinct sessions ARIA has greeted this player. */
  readonly sessionCount: number;
  /** Milestones already celebrated, so ARIA doesn't celebrate the same one twice. */
  readonly celebratedMilestones: readonly string[];
  /** Socratic ladder position per misconception id (how many steps already shown). */
  readonly socraticProgress: Readonly<Record<string, number>>;
}

export const EMPTY_MEMORY: MentorMemory = {
  events: [],
  lastVisitAt: null,
  sessionCount: 0,
  celebratedMilestones: [],
  socraticProgress: {},
};

/** Cap stored events so memory can't grow unbounded; keep the most recent N. */
const MAX_EVENTS = 500;

export function recordEvent(memory: MentorMemory, event: MentorEvent): MentorMemory {
  const events = [...memory.events, event].slice(-MAX_EVENTS);
  return { ...memory, events };
}

/** Record the beginning of a new session, rotating lastVisitAt and bumping the counter. */
export function beginSession(memory: MentorMemory, now: number): MentorMemory {
  const withEvent = recordEvent(memory, { type: 'session-start', at: now });
  return {
    ...withEvent,
    lastVisitAt: lastSessionStartBefore(memory, now),
    sessionCount: memory.sessionCount + 1,
  };
}

function lastSessionStartBefore(memory: MentorMemory, now: number): number | null {
  for (let i = memory.events.length - 1; i >= 0; i -= 1) {
    const e = memory.events[i]!;
    if (e.type === 'session-start' && e.at < now) return e.at;
  }
  return memory.lastVisitAt;
}

export function markMilestoneCelebrated(memory: MentorMemory, milestoneId: string): MentorMemory {
  if (memory.celebratedMilestones.includes(milestoneId)) return memory;
  return {
    ...memory,
    celebratedMilestones: [...memory.celebratedMilestones, milestoneId],
  };
}

export function hasCelebrated(memory: MentorMemory, milestoneId: string): boolean {
  return memory.celebratedMilestones.includes(milestoneId);
}

/** Advance the Socratic ladder for a misconception by one step; returns the new count. */
export function advanceSocratic(memory: MentorMemory, misconceptionId: string): MentorMemory {
  return {
    ...memory,
    socraticProgress: {
      ...memory.socraticProgress,
      [misconceptionId]: (memory.socraticProgress[misconceptionId] ?? 0) + 1,
    },
  };
}

export function socraticStep(memory: MentorMemory, misconceptionId: string): number {
  return memory.socraticProgress[misconceptionId] ?? 0;
}

// ---------------------------------------------------------------------------
// Selectors — read-only queries the coaching layer uses to understand history.
// ---------------------------------------------------------------------------

export function recentEvents(memory: MentorMemory, type: MentorEventType, limit = 5): MentorEvent[] {
  const out: MentorEvent[] = [];
  for (let i = memory.events.length - 1; i >= 0 && out.length < limit; i -= 1) {
    if (memory.events[i]!.type === type) out.push(memory.events[i]!);
  }
  return out;
}

export function countEvents(memory: MentorMemory, type: MentorEventType): number {
  return memory.events.reduce((n, e) => (e.type === type ? n + 1 : n), 0);
}

/**
 * Misconception/mistake refIds the player has made more than once — the "repeated
 * mistakes" ARIA can call out. Returns ids sorted by descending frequency.
 */
export function repeatedMistakes(memory: MentorMemory, minOccurrences = 2): string[] {
  const counts = new Map<string, number>();
  for (const e of memory.events) {
    if (e.type === 'mistake-made' && e.refId) {
      counts.set(e.refId, (counts.get(e.refId) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= minOccurrences)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

/** Most recently completed mission ids, newest first. */
export function recentlyCompletedMissions(memory: MentorMemory, limit = 5): string[] {
  return recentEvents(memory, 'mission-completed', limit)
    .map((e) => e.refId)
    .filter((id): id is string => Boolean(id));
}

/** Whole days between the player's previous visit and now; null if this is their first. */
export function daysSinceLastVisit(memory: MentorMemory, now: number): number | null {
  if (memory.lastVisitAt === null) return null;
  const ms = now - memory.lastVisitAt;
  if (ms <= 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}
