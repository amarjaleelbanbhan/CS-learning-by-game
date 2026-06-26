import { describe, expect, it, vi } from 'vitest';
import { EventBus, buildTrace, frameAt } from '../src/index.js';

describe('buildTrace', () => {
  it('indexes frames in order and carries outcome', () => {
    const trace = buildTrace(
      [
        { label: 'start', data: 'q0' },
        { label: 'read a', data: 'q1' },
      ],
      'accept',
    );
    expect(trace.frames.map((f) => f.index)).toEqual([0, 1]);
    expect(trace.outcome).toBe('accept');
    expect(frameAt(trace, 1)?.data).toBe('q1');
    expect(frameAt(trace, 99)).toBeUndefined();
  });
});

describe('EventBus', () => {
  it('delivers payloads to subscribers and supports unsubscribe', () => {
    const bus = new EventBus<{ tick: number }>();
    const spy = vi.fn();
    const off = bus.on('tick', spy);
    bus.emit('tick', 1);
    off();
    bus.emit('tick', 2);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
  });
});
