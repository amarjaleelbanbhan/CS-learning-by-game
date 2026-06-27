'use client';

import { create } from 'zustand';

interface UiState {
  bootActive: boolean;
  setBootActive: (v: boolean) => void;
  /** Replays the boot cinematic on demand (e.g. a "Replay Intro" link). */
  replayBoot: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  bootActive: false,
  setBootActive: (v) => set({ bootActive: v }),
  replayBoot: () => set({ bootActive: true }),
}));

export const BOOTED_KEY = 'arc-reactor-booted';
