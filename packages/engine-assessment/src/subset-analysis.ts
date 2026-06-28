import { stateId, type StateId } from '@arc/shared';
import {
  EPSILON,
  epsilonClosure,
  move,
  reachableStates,
  subsetConstruction,
  subsetLabel,
  type DFA,
  type NFA,
} from '@arc/engine-automata';
import { gradeDfaConstruction } from './dfa-grading.js';

/**
 * Subset-construction mistake analysis. `gradeDfaConstruction` already tells the player
 * WHETHER they're wrong (by language equivalence) and gives a counterexample string —
 * this module explains WHY, in subset-construction-specific terms, by treating each
 * player state's label as a CLAIMED subset of NFA states and comparing the claim against
 * the canonical reachable subsets `subsetConstruction` actually computes.
 *
 * This only works when the player has labeled states as subsets (e.g. "q0,q1" or
 * "{q0,q1}") — exactly what the mission asks them to do. A state whose label doesn't
 * parse as a subset is reported as unmatched (folded into `missing-subset`/`unused-state`
 * as appropriate) rather than crashing; grading by language equivalence never depends on
 * labels at all, so `correct`/`counterexample` stay accurate either way.
 */
export type SubsetMistakeKind =
  | 'missing-subset'
  | 'wrong-transition'
  | 'wrong-accepting'
  | 'wrong-epsilon-closure'
  | 'duplicate-subset'
  | 'unused-state';

export interface SubsetMistake {
  readonly kind: SubsetMistakeKind;
  readonly detail: string;
  readonly stateId?: string;
}

export interface SubsetAnalysisResult {
  readonly correct: boolean;
  readonly counterexample: string | null;
  readonly mistakes: readonly SubsetMistake[];
}

/**
 * Parses a state label as a claimed subset of NFA state ids. Accepts "q0,q1", "{q0,q1}",
 * "{ q0, q1 }", "q0", "", "{}", "∅". Returns null for malformed input (e.g. a trailing
 * comma) so callers can tell "empty subset" apart from "not a subset at all".
 */
export function parseSubsetLabel(label: string): Set<string> | null {
  const trimmed = label.trim();
  if (trimmed === '' || trimmed === '∅' || trimmed === '{}') return new Set();
  const inner =
    trimmed.startsWith('{') && trimmed.endsWith('}') ? trimmed.slice(1, -1).trim() : trimmed;
  if (inner === '') return new Set();
  const tokens = inner.split(',').map((t) => t.trim());
  if (tokens.some((t) => t.length === 0)) return null;
  return new Set(tokens);
}

function canonicalLabel(set: ReadonlySet<string>): string {
  return subsetLabel(new Set([...set].map(stateId)));
}

/** Reconstructs the actual NFA-state Set behind a canonical (sorted, comma-joined) label. */
function statesFromCanonicalLabel(label: string): Set<StateId> {
  return new Set(
    label
      .split(',')
      .filter((s) => s.length > 0)
      .map(stateId),
  );
}

/**
 * True when `playerTarget` looks like the player computed `move` correctly but forgot to
 * take the ε-closure afterward (a strict subset of the correct closed target that still
 * contains every directly-moved-to state).
 */
function isMissingEpsilonClosure(
  playerTarget: ReadonlySet<string>,
  moveOnly: ReadonlySet<StateId>,
  withClosure: ReadonlySet<StateId>,
): boolean {
  const closureAdds = [...withClosure].filter((s) => !moveOnly.has(s));
  if (closureAdds.length === 0) return false; // no ε-transition was even involved here
  const hasEveryMoveState = [...moveOnly].every((s) => playerTarget.has(s));
  const missingSomeClosureAdd = closureAdds.some((s) => !playerTarget.has(s));
  const hasNoExtraneousStates = [...playerTarget].every((s) => withClosure.has(stateId(s)));
  return hasEveryMoveState && missingSomeClosureAdd && hasNoExtraneousStates;
}

export function analyzeSubsetConstruction(player: DFA, nfa: NFA): SubsetAnalysisResult {
  const reference = subsetConstruction(nfa);
  const grade = gradeDfaConstruction(player, reference.dfa);
  const mistakes: SubsetMistake[] = [];

  const parsedByState = new Map<string, Set<string> | null>();
  for (const s of player.states) parsedByState.set(s, parseSubsetLabel(s));

  // duplicate-subset: two player states parse to the same subset.
  const firstStateForCanonical = new Map<string, string>();
  for (const [pid, parsed] of parsedByState) {
    if (!parsed) continue;
    const canon = canonicalLabel(parsed);
    const first = firstStateForCanonical.get(canon);
    if (first === undefined) {
      firstStateForCanonical.set(canon, pid);
    } else {
      mistakes.push({
        kind: 'duplicate-subset',
        detail: `States "${first}" and "${pid}" both represent the same subset {${canon || '∅'}}.`,
        stateId: pid,
      });
    }
  }

  // unused-state: a player state unreachable from their own start state.
  const reachable = reachableStates(player);
  for (const s of player.states) {
    if (!reachable.has(s)) {
      mistakes.push({
        kind: 'unused-state',
        detail: `State "${s}" can never be reached from the start state.`,
        stateId: s,
      });
    }
  }

  // Map each VALID reachable canonical subset to whichever player state claims it.
  const playerIdForCanonical = new Map<string, string>();
  for (const [pid, parsed] of parsedByState) {
    if (parsed) playerIdForCanonical.set(canonicalLabel(parsed), pid);
  }
  const referenceLabels = reference.dfa.states.map((s) => s as string);

  // missing-subset: a reachable subset the player never created.
  for (const refLabel of referenceLabels) {
    if (!playerIdForCanonical.has(refLabel)) {
      mistakes.push({
        kind: 'missing-subset',
        detail: `No state represents the reachable subset {${refLabel || '∅'}}.`,
      });
    }
  }

  // wrong-accepting: for matched states, check acceptance against the reference.
  for (const refLabel of referenceLabels) {
    const pid = playerIdForCanonical.get(refLabel);
    if (pid === undefined) continue;
    const shouldAccept = reference.dfa.accepting.has(stateId(refLabel));
    const isAccepting = player.accepting.has(stateId(pid));
    if (isAccepting !== shouldAccept) {
      mistakes.push({
        kind: 'wrong-accepting',
        detail: `State "${pid}" {${refLabel || '∅'}} should ${shouldAccept ? '' : 'not '}be accepting.`,
        stateId: pid,
      });
    }
  }

  // wrong-transition / wrong-epsilon-closure: for matched states, check every symbol.
  const alphabet = nfa.alphabet.filter((s) => s !== EPSILON);
  for (const refLabel of referenceLabels) {
    const pid = playerIdForCanonical.get(refLabel);
    if (pid === undefined) continue;
    const fromSet = statesFromCanonicalLabel(refLabel);
    const refRow = reference.dfa.delta.get(stateId(refLabel));
    const playerRow = player.delta.get(stateId(pid));

    for (const sym of alphabet) {
      const refTargetLabel = refRow?.get(sym) as string | undefined;
      if (refTargetLabel === undefined) continue;

      const playerTargetId = playerRow?.get(sym);
      if (playerTargetId === undefined) {
        mistakes.push({
          kind: 'wrong-transition',
          detail: `From "${pid}" on '${sym}': missing a transition (should go to {${refTargetLabel || '∅'}}).`,
          stateId: pid,
        });
        continue;
      }

      const playerTargetParsed = parsedByState.get(playerTargetId);
      const playerTargetCanon = playerTargetParsed ? canonicalLabel(playerTargetParsed) : null;
      if (playerTargetCanon === refTargetLabel) continue; // correct

      const moveOnly = move(nfa, fromSet, sym);
      const withClosure = epsilonClosure(nfa, moveOnly);
      if (
        playerTargetParsed &&
        isMissingEpsilonClosure(playerTargetParsed, moveOnly, withClosure)
      ) {
        mistakes.push({
          kind: 'wrong-epsilon-closure',
          detail: `From "${pid}" on '${sym}': target is missing ε-closure members — should be {${refTargetLabel}}, not {${playerTargetCanon}}.`,
          stateId: playerTargetId,
        });
      } else {
        mistakes.push({
          kind: 'wrong-transition',
          detail: `From "${pid}" on '${sym}': goes to {${playerTargetCanon ?? playerTargetId}} but should go to {${refTargetLabel || '∅'}}.`,
          stateId: pid,
        });
      }
    }
  }

  return { correct: grade.correct, counterexample: grade.counterexample, mistakes };
}
