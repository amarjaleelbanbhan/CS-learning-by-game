'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EMPTY_MEMORY,
  advanceSocratic,
  beginSession,
  markMilestoneCelebrated,
  recordEvent,
  type MentorEvent,
  type MentorMemory,
  type MentorMode,
  type MentorPreferences,
} from '@arc/engine-ai';

/**
 * ARIA's persistent memory + mentor preferences (offline-first, localStorage).
 *
 * This store holds ONLY what genuinely happened (events the app recorded from real engine
 * state) plus the player's coaching-style preference. ARIA never reads anything else as
 * "memory" — if it isn't here, ARIA doesn't claim it. Supabase sync (migration 0005) is a
 * write-through on top of this; gameplay never waits on the network.
 */
interface MentorStore {
  memory: MentorMemory;
  preferences: MentorPreferences;
  /** Open a new session (rotates lastVisitAt, bumps the session counter). */
  begin: () => void;
  record: (event: MentorEvent) => void;
  /** Advance the Socratic ladder for a misconception by one rung. */
  advance: (misconceptionId: string) => void;
  /** Mark a milestone celebrated so ARIA never celebrates it twice. */
  celebrate: (milestoneId: string) => void;
  setMode: (mode: MentorMode) => void;
  setAutoMode: (autoMode: boolean) => void;
  reset: () => void;
}

export const useMentorStore = create<MentorStore>()(
  persist(
    (set) => ({
      memory: EMPTY_MEMORY,
      preferences: { mode: 'encouraging', autoMode: true },

      begin: () => set((s) => ({ memory: beginSession(s.memory, Date.now()) })),
      record: (event) => set((s) => ({ memory: recordEvent(s.memory, event) })),
      advance: (misconceptionId) =>
        set((s) => ({ memory: advanceSocratic(s.memory, misconceptionId) })),
      celebrate: (milestoneId) =>
        set((s) => ({ memory: markMilestoneCelebrated(s.memory, milestoneId) })),

      setMode: (mode) => set((s) => ({ preferences: { ...s.preferences, mode } })),
      setAutoMode: (autoMode) => set((s) => ({ preferences: { ...s.preferences, autoMode } })),

      reset: () =>
        set({ memory: EMPTY_MEMORY, preferences: { mode: 'encouraging', autoMode: true } }),
    }),
    { name: 'arc-reactor-mentor' },
  ),
);
