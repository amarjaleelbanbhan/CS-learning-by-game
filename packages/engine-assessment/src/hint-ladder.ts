import type { HintKind } from './types.js';

/**
 * The escalation order itself (attempt 1 always gets nothing — the player
 * must try before ARIA says a word). Index 0 unlocks after the 1st failed
 * attempt, index 5 (the full visualization) only after the 6th.
 */
export const HINT_KIND_ORDER: readonly HintKind[] = [
  'tiny-hint',
  'question',
  'highlight-state',
  'highlight-transition',
  'animate-idea',
  'visualization',
];

/**
 * Maps a count of FAILED attempts to the highest hint tier currently
 * unlocked. Returns -1 when no hint has been earned yet.
 *
 *   failedAttempts  0  1  2  3  4  5  6+
 *   unlocked tier  -1  0  1  2  3  4   5
 */
export function unlockedHintTier(failedAttempts: number): number {
  if (failedAttempts <= 0) return -1;
  return Math.min(failedAttempts - 1, HINT_KIND_ORDER.length - 1);
}

export function unlockedHintKind(failedAttempts: number): HintKind | null {
  const tier = unlockedHintTier(failedAttempts);
  return tier === -1 ? null : HINT_KIND_ORDER[tier]!;
}
