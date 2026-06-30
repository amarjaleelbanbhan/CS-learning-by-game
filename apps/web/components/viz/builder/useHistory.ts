'use client';

import { useCallback, useState } from 'react';
import {
  canRedoHistory,
  canUndoHistory,
  initHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type HistoryState,
} from '@/lib/automata/history';

export interface UseHistory<T> {
  value: T;
  /** Records a new value as a fresh undo point (clears redo). */
  set: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Replaces the value AND clears all history — used when switching difficulty tiers. */
  reset: (next: T) => void;
  /** The full sequence of values that led to the current one, oldest first, current last —
   * the player's actual edit path (not anything they later undid past). Reused as the
   * source for "replay this attempt" rather than maintaining a separate action log. */
  snapshots: readonly T[];
}

/** Thin React wrapper over the pure history.ts reducer functions. */
export function useHistory<T>(initial: T): UseHistory<T> {
  const [state, setState] = useState<HistoryState<T>>(() => initHistory(initial));

  const set = useCallback((next: T) => setState((s) => pushHistory(s, next)), []);
  const undo = useCallback(() => setState(undoHistory), []);
  const redo = useCallback(() => setState(redoHistory), []);
  const reset = useCallback((next: T) => setState(initHistory(next)), []);

  return {
    value: state.present,
    set,
    undo,
    redo,
    canUndo: canUndoHistory(state),
    canRedo: canRedoHistory(state),
    reset,
    snapshots: [...state.past, state.present],
  };
}
