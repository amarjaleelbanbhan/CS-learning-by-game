'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Frame, Trace } from '@arc/engine-core';
import { buildTimeline, indexAtTime } from '@arc/engine-animation';

export interface Playback<T> {
  index: number;
  frame: Frame<T> | undefined;
  total: number;
  isPlaying: boolean;
  atEnd: boolean;
  progress: number; // 0..1
  speed: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stepForward: () => void;
  stepBack: () => void;
  restart: () => void;
  seek: (index: number) => void;
  setSpeed: (s: number) => void;
}

/** Drives a trace over a wall-clock timeline using requestAnimationFrame. */
export function usePlayback<T>(trace: Trace<T>): Playback<T> {
  const timeline = useMemo(
    () => buildTimeline(trace, { stepDurationMs: 850, finalHoldMs: 800 }),
    [trace],
  );
  const total = timeline.keyframes.length;

  const [ms, setMs] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // Reset whenever a new trace arrives.
  useEffect(() => {
    setMs(0);
    setPlaying(false);
  }, [timeline]);

  useEffect(() => {
    if (!isPlaying) {
      lastRef.current = null;
      return;
    }
    const tick = (t: number): void => {
      if (lastRef.current != null) {
        const dt = (t - lastRef.current) * speedRef.current;
        setMs((prev) => {
          const next = prev + dt;
          if (next >= timeline.durationMs) {
            setPlaying(false);
            return timeline.durationMs;
          }
          return next;
        });
      }
      lastRef.current = t;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [isPlaying, timeline]);

  const index = indexAtTime(timeline, ms);
  const atEnd = index >= total - 1 && ms >= timeline.durationMs - 1;

  const seekIndex = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(i, total - 1));
      setMs(timeline.keyframes[clamped]?.startMs ?? 0);
    },
    [timeline, total],
  );

  const play = useCallback(() => {
    if (ms >= timeline.durationMs - 1) setMs(0);
    setPlaying(true);
  }, [ms, timeline.durationMs]);

  const pause = useCallback(() => setPlaying(false), []);

  return {
    index,
    frame: timeline.keyframes[index]?.frame,
    total,
    isPlaying,
    atEnd,
    progress: timeline.durationMs > 0 ? ms / timeline.durationMs : 0,
    speed,
    play,
    pause,
    toggle: () => (isPlaying ? pause() : play()),
    stepForward: () => {
      setPlaying(false);
      seekIndex(index + 1);
    },
    stepBack: () => {
      setPlaying(false);
      seekIndex(index - 1);
    },
    restart: () => {
      setPlaying(false);
      setMs(0);
    },
    seek: seekIndex,
    setSpeed,
  };
}
