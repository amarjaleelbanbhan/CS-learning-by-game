import { describe, expect, it } from 'vitest';
import { HINT_KIND_ORDER, unlockedHintKind, unlockedHintTier } from '../src/index.js';

describe('unlockedHintTier', () => {
  it('gives nothing on the first attempt', () => {
    expect(unlockedHintTier(0)).toBe(-1);
    expect(unlockedHintKind(0)).toBeNull();
  });

  it('escalates one tier per failed attempt', () => {
    expect(unlockedHintTier(1)).toBe(0);
    expect(unlockedHintTier(2)).toBe(1);
    expect(unlockedHintTier(3)).toBe(2);
    expect(unlockedHintTier(4)).toBe(3);
    expect(unlockedHintTier(5)).toBe(4);
    expect(unlockedHintTier(6)).toBe(5);
  });

  it('caps at the final tier (visualization) and never exceeds it', () => {
    expect(unlockedHintTier(6)).toBe(HINT_KIND_ORDER.length - 1);
    expect(unlockedHintTier(50)).toBe(HINT_KIND_ORDER.length - 1);
    expect(unlockedHintKind(50)).toBe('visualization');
  });

  it('matches the documented escalation order', () => {
    expect(HINT_KIND_ORDER).toEqual([
      'tiny-hint',
      'question',
      'highlight-state',
      'highlight-transition',
      'animate-idea',
      'visualization',
    ]);
  });
});
