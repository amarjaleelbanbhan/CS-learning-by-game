import { describe, expect, it } from 'vitest';
import { createRng } from '../src/rng.js';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng('arc-reactor');
    const b = createRng('arc-reactor');
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('differs across seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('next() stays within [0, 1)', () => {
    const r = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('shuffle is a permutation and deterministic', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = createRng('s').shuffle(input);
    const s2 = createRng('s').shuffle(input);
    expect(s1).toEqual(s2);
    expect([...s1].sort()).toEqual(input);
  });

  it('pick throws on empty array', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });
});
