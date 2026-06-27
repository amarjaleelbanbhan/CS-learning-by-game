'use client';

import { create } from 'zustand';
import { pickLine, type CompanionEvent } from '@/lib/companion/lines';

interface CompanionState {
  message: string | null;
  visible: boolean;
  /** Speak a scripted line for an event, or arbitrary text if provided. */
  say: (event: CompanionEvent, text?: string) => void;
  dismiss: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | undefined;

export const useCompanionStore = create<CompanionState>((set) => ({
  message: null,
  visible: false,
  say: (event, text) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: text ?? pickLine(event), visible: true });
    hideTimer = setTimeout(() => set({ visible: false }), 6000);
  },
  dismiss: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: false });
  },
}));
