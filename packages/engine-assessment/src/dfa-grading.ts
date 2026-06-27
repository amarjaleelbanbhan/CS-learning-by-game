import { areEquivalent, findDistinguishingString, type DFA } from '@arc/engine-automata';
import type { GradeResult } from './types.js';

/**
 * Grades a player-built DFA against a hidden reference by LANGUAGE
 * EQUIVALENCE — never graph shape, state count, or naming. A correct answer
 * with 7 states and a correct answer with 3 states both pass; a wrong answer
 * gets back the shortest string where it disagrees with the target, which is
 * the hint ladder's highest-tier hint, not the grading mechanism itself.
 */
export function gradeDfaConstruction(player: DFA, reference: DFA): GradeResult {
  if (areEquivalent(player, reference)) {
    return { correct: true, counterexample: null };
  }
  return { correct: false, counterexample: findDistinguishingString(player, reference) };
}
