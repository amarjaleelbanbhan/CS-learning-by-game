import { GraderRegistry, type AnyGrader } from '../grader.js';
import {
  dfaEquivalenceGrader,
  membershipPredictionGrader,
  nfaEquivalenceGrader,
  regexEquivalenceGrader,
} from './automaton.js';
import { choiceGrader, matchingGrader, numericGrader, orderingGrader } from './objective.js';

export type { DfaSpec, NfaSpec, RegexSpec, MembershipSpec } from './automaton.js';
export {
  dfaEquivalenceGrader,
  nfaEquivalenceGrader,
  regexEquivalenceGrader,
  membershipPredictionGrader,
} from './automaton.js';

export type { ChoiceSpec, NumericSpec, OrderingSpec, MatchingSpec } from './objective.js';
export { choiceGrader, numericGrader, orderingGrader, matchingGrader } from './objective.js';

/**
 * Every grader shipped today. Adding a topic (CFG, PDA, TM) means adding a grader to this
 * list — not editing a switch statement anywhere.
 */
export const BUILT_IN_GRADERS: readonly AnyGrader[] = [
  dfaEquivalenceGrader,
  nfaEquivalenceGrader,
  regexEquivalenceGrader,
  membershipPredictionGrader,
  choiceGrader,
  numericGrader,
  orderingGrader,
  matchingGrader,
];

/** A registry pre-populated with the built-ins. */
export function createDefaultRegistry(): GraderRegistry {
  const registry = new GraderRegistry();
  for (const grader of BUILT_IN_GRADERS) registry.register(grader);
  return registry;
}
