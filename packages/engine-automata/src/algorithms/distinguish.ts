import type { StateId } from '@arc/shared';
import type { DFA } from '../models/dfa.js';
import { completeDfa } from './util.js';
import { productDfa } from './product.js';

/**
 * Finds the SHORTEST string on which `a` and `b` disagree (one accepts, the
 * other rejects), or null if they are equivalent. Built on the symmetric-
 * difference product (already used by `areEquivalent`): a state of that
 * product is accepting exactly when the two machines disagree, so the
 * shortest path from its start to any accepting state — found via BFS, since
 * all edges have equal weight — is the shortest distinguishing string.
 *
 * This powers the construction-mission hint ladder's later tiers ("here's a
 * string where your machine disagrees with the target") without ever
 * comparing graph shape, only language behavior.
 */
export function findDistinguishingString(a: DFA, b: DFA, maxLength = 12): string | null {
  const diff = productDfa(a, b, 'symmetric');
  if (diff.accepting.size === 0) return null;

  const complete = completeDfa(diff);
  const cameFrom = new Map<StateId, { from: StateId; sym: string }>();
  const visited = new Set<StateId>([complete.start]);
  const queue: StateId[] = [complete.start];

  if (complete.accepting.has(complete.start)) return '';

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++]!;
    const depth = pathLength(cameFrom, current);
    if (depth >= maxLength) continue;
    const row = complete.delta.get(current);
    if (!row) continue;
    for (const sym of complete.alphabet) {
      const next = row.get(sym);
      if (next === undefined || visited.has(next)) continue;
      visited.add(next);
      cameFrom.set(next, { from: current, sym });
      if (complete.accepting.has(next)) return reconstruct(cameFrom, next);
      queue.push(next);
    }
  }
  return null;
}

function pathLength(
  cameFrom: Map<StateId, { from: StateId; sym: string }>,
  state: StateId,
): number {
  let len = 0;
  let cur: StateId | undefined = state;
  while (cur && cameFrom.has(cur)) {
    len++;
    cur = cameFrom.get(cur)?.from;
  }
  return len;
}

function reconstruct(
  cameFrom: Map<StateId, { from: StateId; sym: string }>,
  target: StateId,
): string {
  const symbols: string[] = [];
  let cur: StateId | undefined = target;
  while (cur !== undefined) {
    const step: { from: StateId; sym: string } | undefined = cameFrom.get(cur);
    if (!step) break;
    symbols.push(step.sym);
    cur = step.from;
  }
  return symbols.reverse().join('');
}
