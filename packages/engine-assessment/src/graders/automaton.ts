import {
  accepts,
  acceptsNFA,
  areEquivalent,
  findDistinguishingString,
  regexToNfa,
  subsetConstruction,
  type DFA,
  type NFA,
} from '@arc/engine-automata';
import type { Grader } from '../grader.js';
import { correct, incorrect, type Counterexample, type Verdict } from '../verdict.js';

/**
 * Graders for anything that denotes a regular language.
 *
 * All three reduce to the same question — *do these two machines accept the same set of
 * strings?* — which is why they can share one diagnosis path. That reduction is the
 * project's core grading philosophy: a player's answer passes because it is
 * language-equivalent to the reference, never because it looks like it.
 */

/** Builds the counterexample that turns "wrong" into a lesson. */
function witness(player: DFA, reference: DFA): Counterexample | null {
  const input = findDistinguishingString(player, reference);
  if (input === null) return null;
  const playerAccepts = accepts(player, input);
  return {
    input,
    playerResult: playerAccepts ? 'accepted' : 'rejected',
    expectedResult: playerAccepts ? 'should be rejected' : 'should be accepted',
  };
}

function verdictFor(player: DFA, reference: DFA, noun: string): Verdict {
  if (areEquivalent(player, reference)) {
    return correct([`Correct — your ${noun} accepts exactly the target language.`]);
  }
  const counterexample = witness(player, reference);
  const feedback = counterexample
    ? [
        `Not yet. Your ${noun} ${counterexample.playerResult} "${counterexample.input || 'ε'}", but it ${counterexample.expectedResult}.`,
      ]
    : [`Not yet — your ${noun} does not accept the target language.`];
  return incorrect({
    mistakes: [
      { code: 'language-mismatch', message: `The ${noun} recognises a different language.` },
    ],
    counterexample,
    feedback,
    nextStep: counterexample
      ? `Trace "${counterexample.input || 'ε'}" through your ${noun} by hand and see where it goes wrong.`
      : 'Test a few strings that should be accepted, and a few that should not.',
  });
}

function structuralProblems(dfa: DFA): string[] {
  const problems: string[] = [];
  if (dfa.states.length === 0) problems.push('This machine has no states yet.');
  else if (!dfa.states.includes(dfa.start)) problems.push('No start state is marked.');
  if (dfa.accepting.size === 0) {
    problems.push('No accepting state is marked — this machine rejects everything.');
  }
  return problems;
}

export interface DfaSpec {
  readonly reference: DFA;
}

export const dfaEquivalenceGrader: Grader<DFA, DfaSpec> = {
  id: 'dfa-equivalence',
  normalize: (raw) => (isDfa(raw) ? raw : null),
  validate: (answer) => structuralProblems(answer),
  grade: (answer, spec) => verdictFor(answer, spec.reference, 'DFA'),
};

export interface NfaSpec {
  readonly reference: NFA;
}

/**
 * NFA answers are graded by determinizing both sides first. Equivalence is only decidable
 * on DFAs, and determinizing is exactly the operation that makes an NFA comparable —
 * so the player is free to submit any nondeterministic machine that works.
 */
export const nfaEquivalenceGrader: Grader<NFA, NfaSpec> = {
  id: 'nfa-equivalence',
  normalize: (raw) => (isNfa(raw) ? raw : null),
  validate: (answer) => {
    const problems: string[] = [];
    if (answer.states.length === 0) problems.push('This machine has no states yet.');
    else if (!answer.states.includes(answer.start)) problems.push('No start state is marked.');
    if (answer.accepting.size === 0) {
      problems.push('No accepting state is marked — this machine rejects everything.');
    }
    return problems;
  },
  grade: (answer, spec) =>
    verdictFor(subsetConstruction(answer).dfa, subsetConstruction(spec.reference).dfa, 'NFA'),
};

export interface RegexSpec {
  /** Reference pattern. The player's answer need only be equivalent, not identical. */
  readonly referenceSource: string;
}

/**
 * Regex grading composes the pipeline the engine already had: parse → Thompson → subset
 * construction → equivalence. This previously lived inline inside a React mission
 * component, which meant it could not be tested, reused, or diagnosed consistently.
 *
 * A syntax error is reported by `validate`, not `grade`, so a mistyped pattern costs the
 * player nothing — it is not a wrong answer.
 */
export const regexEquivalenceGrader: Grader<string, RegexSpec> = {
  id: 'regex-equivalence',
  normalize: (raw) => {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed.length === 0 ? null : trimmed;
  },
  validate: (answer) => {
    const parsed = regexToNfa(answer);
    return parsed.ok ? [] : [`That pattern doesn't parse: ${parsed.error}`];
  },
  grade: (answer, spec) => {
    const player = regexToNfa(answer);
    const reference = regexToNfa(spec.referenceSource);
    // validate() already proved the player's side parses; a broken reference is an
    // authoring bug, so surface it as one rather than blaming the player.
    if (!player.ok) return incorrect({ feedback: [`That pattern doesn't parse: ${player.error}`] });
    if (!reference.ok) {
      throw new Error(
        `Reference pattern "${spec.referenceSource}" does not parse: ${reference.error}`,
      );
    }
    return verdictFor(
      subsetConstruction(player.value).dfa,
      subsetConstruction(reference.value).dfa,
      'pattern',
    );
  },
};

export interface MembershipSpec {
  readonly machine: DFA | NFA;
  readonly input: string;
}

/**
 * The `Predict` verb: the player commits to accept/reject before the simulation runs.
 * Cheapest possible conversion of a passive animation into a real task.
 */
export const membershipPredictionGrader: Grader<boolean, MembershipSpec> = {
  id: 'membership-prediction',
  normalize: (raw) => (typeof raw === 'boolean' ? raw : null),
  validate: () => [],
  grade: (answer, spec) => {
    const truth = isDfa(spec.machine)
      ? accepts(spec.machine, spec.input)
      : acceptsNFA(spec.machine, spec.input);
    if (answer === truth) {
      return correct([
        `Right — the machine ${truth ? 'accepts' : 'rejects'} "${spec.input || 'ε'}".`,
      ]);
    }
    return incorrect({
      mistakes: [
        {
          code: truth ? 'predicted-reject-actual-accept' : 'predicted-accept-actual-reject',
          message: `Predicted ${answer ? 'accept' : 'reject'}, but the machine ${truth ? 'accepts' : 'rejects'} it.`,
        },
      ],
      feedback: [
        `Not quite — the machine ${truth ? 'accepts' : 'rejects'} "${spec.input || 'ε'}".`,
      ],
      nextStep: 'Step through the trace and watch which state it halts in.',
    });
  },
};

/**
 * DFA and NFA are structurally near-identical; the only discriminator is the delta value
 * type — a DFA maps a symbol to ONE state, an NFA to a SET of them. An empty delta is
 * ambiguous by definition, so both guards accept it and the caller's declared type wins.
 */
function hasAutomatonShape(
  value: unknown,
): value is { readonly delta: ReadonlyMap<string, unknown> } {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as {
    states?: unknown;
    start?: unknown;
    accepting?: unknown;
    delta?: unknown;
  };
  return (
    Array.isArray(candidate.states) &&
    typeof candidate.start === 'string' &&
    candidate.accepting instanceof Set &&
    candidate.delta instanceof Map
  );
}

/** The first transition target found, or undefined when delta is empty. */
function sampleTarget(delta: ReadonlyMap<string, unknown>): unknown {
  for (const row of delta.values()) {
    if (row instanceof Map) {
      for (const target of row.values()) return target;
    }
  }
  return undefined;
}

function isDfa(value: unknown): value is DFA {
  if (!hasAutomatonShape(value)) return false;
  const target = sampleTarget(value.delta);
  return target === undefined || typeof target === 'string';
}

function isNfa(value: unknown): value is NFA {
  if (!hasAutomatonShape(value)) return false;
  const target = sampleTarget(value.delta);
  return target === undefined || target instanceof Set;
}
