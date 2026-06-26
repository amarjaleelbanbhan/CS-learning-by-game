import type { Sym } from '../models/dfa.js';

/** Enumerate every string over `alphabet` of length 0..maxLength (inclusive). */
export function enumerateStrings(alphabet: readonly Sym[], maxLength: number): string[] {
  const out: string[] = [''];
  let frontier: string[] = [''];
  for (let len = 1; len <= maxLength; len++) {
    const next: string[] = [];
    for (const prefix of frontier) {
      for (const sym of alphabet) next.push(prefix + sym);
    }
    out.push(...next);
    frontier = next;
  }
  return out;
}
