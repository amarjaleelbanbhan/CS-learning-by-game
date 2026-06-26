import type { Frame, Trace } from '@arc/engine-core';

/**
 * The animation engine maps a Trace (what happened) onto a wall-clock timeline
 * (when it happens on screen). It is pure: no DOM, no rAF, no tween library.
 * The UI drives a clock and asks `frameAtTime` / `progressAtTime` what to show,
 * so playback (play/pause/scrub/step/speed) lives in the UI layer.
 */
export interface TimelineKeyframe<TData> {
  readonly startMs: number;
  readonly endMs: number;
  readonly frame: Frame<TData>;
}

export interface Timeline<TData> {
  readonly keyframes: readonly TimelineKeyframe<TData>[];
  readonly durationMs: number;
}

export interface TimelineOptions {
  /** Time each frame is held on screen. */
  readonly stepDurationMs?: number;
  /** Extra hold added to the final frame (to linger on accept/reject). */
  readonly finalHoldMs?: number;
}

const DEFAULTS = { stepDurationMs: 700, finalHoldMs: 600 } as const;

export function buildTimeline<TData>(
  trace: Trace<TData>,
  options: TimelineOptions = {},
): Timeline<TData> {
  const stepDurationMs = options.stepDurationMs ?? DEFAULTS.stepDurationMs;
  const finalHoldMs = options.finalHoldMs ?? DEFAULTS.finalHoldMs;

  let cursor = 0;
  const keyframes: TimelineKeyframe<TData>[] = trace.frames.map((frame, i) => {
    const isLast = i === trace.frames.length - 1;
    const duration = stepDurationMs + (isLast ? finalHoldMs : 0);
    const kf: TimelineKeyframe<TData> = { startMs: cursor, endMs: cursor + duration, frame };
    cursor += duration;
    return kf;
  });

  return { keyframes, durationMs: cursor };
}

/** The frame visible at time `ms` (clamped to the timeline bounds). */
export function frameAtTime<TData>(
  timeline: Timeline<TData>,
  ms: number,
): Frame<TData> | undefined {
  if (timeline.keyframes.length === 0) return undefined;
  const clamped = Math.max(0, Math.min(ms, timeline.durationMs));
  for (const kf of timeline.keyframes) {
    if (clamped < kf.endMs) return kf.frame;
  }
  return timeline.keyframes.at(-1)?.frame;
}

/** Eased progress in [0,1] within the keyframe active at `ms` (for transitions). */
export function progressAtTime<TData>(timeline: Timeline<TData>, ms: number): number {
  const clamped = Math.max(0, Math.min(ms, timeline.durationMs));
  for (const kf of timeline.keyframes) {
    if (clamped < kf.endMs) {
      const span = kf.endMs - kf.startMs;
      return span <= 0 ? 1 : (clamped - kf.startMs) / span;
    }
  }
  return 1;
}

/** Index of the keyframe active at `ms` (useful for step controls). */
export function indexAtTime<TData>(timeline: Timeline<TData>, ms: number): number {
  const clamped = Math.max(0, Math.min(ms, timeline.durationMs));
  for (let i = 0; i < timeline.keyframes.length; i++) {
    if (clamped < timeline.keyframes[i]!.endMs) return i;
  }
  return timeline.keyframes.length - 1;
}
