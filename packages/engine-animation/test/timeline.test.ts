import { describe, expect, it } from 'vitest';
import { buildTrace } from '@arc/engine-core';
import { buildTimeline, frameAtTime, indexAtTime, progressAtTime } from '../src/index.js';

const trace = buildTrace(
  [
    { label: 's0', data: 0 },
    { label: 's1', data: 1 },
    { label: 's2', data: 2 },
  ],
  'accept',
);

describe('buildTimeline', () => {
  it('lays out contiguous keyframes with a final hold', () => {
    const tl = buildTimeline(trace, { stepDurationMs: 100, finalHoldMs: 50 });
    expect(tl.keyframes.map((k) => [k.startMs, k.endMs])).toEqual([
      [0, 100],
      [100, 200],
      [200, 350],
    ]);
    expect(tl.durationMs).toBe(350);
  });

  it('frameAtTime selects the active frame and clamps bounds', () => {
    const tl = buildTimeline(trace, { stepDurationMs: 100, finalHoldMs: 0 });
    expect(frameAtTime(tl, -10)?.data).toBe(0);
    expect(frameAtTime(tl, 0)?.data).toBe(0);
    expect(frameAtTime(tl, 150)?.data).toBe(1);
    expect(frameAtTime(tl, 99999)?.data).toBe(2);
  });

  it('indexAtTime and progressAtTime track playback position', () => {
    const tl = buildTimeline(trace, { stepDurationMs: 100, finalHoldMs: 0 });
    expect(indexAtTime(tl, 250)).toBe(2);
    expect(progressAtTime(tl, 150)).toBeCloseTo(0.5, 5);
  });
});
