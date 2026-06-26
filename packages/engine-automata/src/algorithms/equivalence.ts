import type { DFA } from '../models/dfa.js';
import { productDfa } from './product.js';

/**
 * Two DFAs are language-equivalent iff the symmetric-difference product has no
 * reachable accepting state. `productDfa` only materializes reachable states, so
 * an empty accepting set proves equivalence exactly (not just up to some length).
 *
 * This is the foundation of the practice auto-grader: a student's automaton is
 * graded correct iff it is equivalent to the reference — never by graph shape.
 */
export function areEquivalent(a: DFA, b: DFA): boolean {
  return productDfa(a, b, 'symmetric').accepting.size === 0;
}
