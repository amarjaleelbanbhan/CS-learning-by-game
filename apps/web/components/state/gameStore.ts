'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameState {
  xp: number;
  coins: number;
  /** mission id -> completed */
  completed: Record<string, boolean>;
  /** Set of one-off reward keys already granted (prevents double-awarding). */
  claimed: Record<string, boolean>;
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  completeMission: (id: string, xp: number, coins: number) => void;
  /** Grants a reward once per key; returns true if it was newly granted. */
  claimOnce: (key: string, xp: number, coins?: number) => boolean;
  reset: () => void;
}

/** XP needed to reach the *next* level grows quadratically. Level is derived. */
export function levelFromXp(xp: number): { level: number; into: number; span: number } {
  let level = 1;
  let remaining = xp;
  let span = 100;
  while (remaining >= span) {
    remaining -= span;
    level += 1;
    span = Math.round(span * 1.35);
  }
  return { level, into: remaining, span };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      xp: 0,
      coins: 0,
      completed: {},
      claimed: {},
      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),
      addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),
      completeMission: (id, xp, coins) =>
        set((s) =>
          s.completed[id]
            ? s
            : { completed: { ...s.completed, [id]: true }, xp: s.xp + xp, coins: s.coins + coins },
        ),
      claimOnce: (key, xp, coins = 0) => {
        if (get().claimed[key]) return false;
        set((s) => ({
          claimed: { ...s.claimed, [key]: true },
          xp: s.xp + xp,
          coins: s.coins + coins,
        }));
        return true;
      },
      reset: () => set({ xp: 0, coins: 0, completed: {}, claimed: {} }),
    }),
    { name: 'arc-reactor-game' },
  ),
);
