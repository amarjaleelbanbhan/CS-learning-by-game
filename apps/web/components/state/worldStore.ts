'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EMPTY_NPC_MEMORY, recordConversation, type NpcMemory } from '@arc/engine-world';

/**
 * Living World store (PROMPT 07) — NPC relationships/memory, world-event awareness, and
 * unlocked lab decorations. Offline-first (localStorage), mirrored to Supabase migration
 * 0006 for cross-device persistence of "meaningful world state" only — derived/computed
 * values (which NPCs are currently unlocked, the active world event) are NOT stored here;
 * they're recomputed live from career state + the clock by lib/world/world.ts.
 */
export interface WorldState {
  npcRelationshipScore: Record<string, number>;
  npcMemory: Record<string, NpcMemory>;
  unlockedDecorations: string[];
  /** World event ids ARIA has already mentioned once, so it never repeats the mention. */
  mentionedWorldEvents: string[];
  /** Most recently visited district — drives the "you are here" map indicator. */
  currentDistrictId: string | null;

  talkToNpc: (npcId: string, lineId: string, now?: number) => void;
  setCurrentDistrict: (districtId: string) => void;
  /** Marks a world event as mentioned; returns true only the first time (newly mentioned). */
  markWorldEventMentioned: (eventId: string) => boolean;
  unlockDecorations: (ids: readonly string[]) => void;
  reset: () => void;
}

const RELATIONSHIP_GAIN_PER_CONVERSATION = 5;

export const useWorldStore = create<WorldState>()(
  persist(
    (set, get) => ({
      npcRelationshipScore: {},
      npcMemory: {},
      unlockedDecorations: [],
      mentionedWorldEvents: [],
      currentDistrictId: null,

      talkToNpc: (npcId, lineId, now = Date.now()) =>
        set((s) => {
          const memory = s.npcMemory[npcId] ?? EMPTY_NPC_MEMORY;
          return {
            npcMemory: { ...s.npcMemory, [npcId]: recordConversation(memory, now, lineId) },
            npcRelationshipScore: {
              ...s.npcRelationshipScore,
              [npcId]: (s.npcRelationshipScore[npcId] ?? 0) + RELATIONSHIP_GAIN_PER_CONVERSATION,
            },
          };
        }),

      setCurrentDistrict: (districtId) => set({ currentDistrictId: districtId }),

      markWorldEventMentioned: (eventId) => {
        if (get().mentionedWorldEvents.includes(eventId)) return false;
        set((s) => ({ mentionedWorldEvents: [...s.mentionedWorldEvents, eventId] }));
        return true;
      },

      unlockDecorations: (ids) =>
        set((s) => ({
          unlockedDecorations: Array.from(new Set([...s.unlockedDecorations, ...ids])),
        })),

      reset: () =>
        set({
          npcRelationshipScore: {},
          npcMemory: {},
          unlockedDecorations: [],
          mentionedWorldEvents: [],
          currentDistrictId: null,
        }),
    }),
    { name: 'arc-reactor-world' },
  ),
);
