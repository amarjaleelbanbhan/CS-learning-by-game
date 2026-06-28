/**
 * Generic undo/redo history — pure data, no React. Any editor model (builder canvas,
 * future course graphs, anything) can be wrapped in this without depending on a
 * particular UI framework. The thin React hook in components/viz/builder/useHistory.ts
 * is the only framework-coupled layer on top of this.
 */
export interface HistoryState<T> {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
}

export function initHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [] };
}

/** Records a new present value, clearing redo history (the standard undo/redo rule). */
export function pushHistory<T>(h: HistoryState<T>, next: T): HistoryState<T> {
  return { past: [...h.past, h.present], present: next, future: [] };
}

export function undoHistory<T>(h: HistoryState<T>): HistoryState<T> {
  if (h.past.length === 0) return h;
  const previous = h.past[h.past.length - 1]!;
  return { past: h.past.slice(0, -1), present: previous, future: [h.present, ...h.future] };
}

export function redoHistory<T>(h: HistoryState<T>): HistoryState<T> {
  if (h.future.length === 0) return h;
  const next = h.future[0]!;
  return { past: [...h.past, h.present], present: next, future: h.future.slice(1) };
}

export function canUndoHistory<T>(h: HistoryState<T>): boolean {
  return h.past.length > 0;
}

export function canRedoHistory<T>(h: HistoryState<T>): boolean {
  return h.future.length > 0;
}
