/**
 * A Trace is the framework-agnostic record of "what happened" during a
 * computation. The simulation engine produces traces; the animation engine
 * turns them into time-indexed keyframes; the viz layer renders them; the
 * accessibility layer reads them aloud. Pure data — no timing, no pixels.
 */
export type Outcome = 'accept' | 'reject' | 'incomplete';

export interface Frame<TData> {
  readonly index: number;
  /** Short human/SR-readable description of this step. */
  readonly label: string;
  readonly data: TData;
}

export interface Trace<TData> {
  readonly frames: readonly Frame<TData>[];
  readonly outcome: Outcome;
}

export function buildTrace<TData>(
  steps: ReadonlyArray<{ label: string; data: TData }>,
  outcome: Outcome,
): Trace<TData> {
  return {
    frames: steps.map((s, index) => ({ index, label: s.label, data: s.data })),
    outcome,
  };
}

export function frameAt<TData>(trace: Trace<TData>, index: number): Frame<TData> | undefined {
  return trace.frames[index];
}
