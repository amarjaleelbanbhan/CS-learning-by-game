/**
 * The universal result of grading anything.
 *
 * Every grader in the game — DFA equivalence, a parse tree, a pumping-lemma
 * decomposition, a multiple-choice answer — returns this same shape. That is what lets
 * one mission runner, one feedback panel and one analytics pipeline serve every topic
 * without knowing what was graded.
 *
 * The design constraint driving this file: **"wrong" is not an acceptable answer to a
 * student.** A verdict must be able to carry *why*, so `mistakes` and `counterexample`
 * are first-class rather than optional afterthoughts.
 */

/**
 * `invalid` is deliberately distinct from `incorrect`. A DFA with no start state is not a
 * wrong answer — it is an unfinished one, and telling a player "wrong" for it is a lie
 * that costs them an attempt and a hint tier.
 */
export type Outcome = 'correct' | 'partial' | 'incorrect' | 'invalid';

/**
 * A named, machine-readable defect.
 *
 * `code` is a stable identifier so analytics can aggregate "how many players make this
 * specific error" across sessions, and so ARIA can react to a *kind* of mistake rather
 * than to prose. Never generate codes dynamically — they are a closed vocabulary per
 * grader.
 */
export interface Mistake {
  readonly code: string;
  /** Player-facing description of this specific defect. */
  readonly message: string;
  /** Optional locator — a state id, production index, tape cell, tree path. */
  readonly where?: string;
}

/**
 * Concrete evidence that an answer is wrong.
 *
 * A counterexample is the single most valuable teaching artefact the engine produces:
 * it converts "your machine is wrong" into "your machine accepts 010 and it shouldn't",
 * which is a complete lesson in one line.
 */
export interface Counterexample {
  /** The witnessing input, e.g. a string the two machines disagree on. */
  readonly input: string;
  /** What the player's answer does with it. */
  readonly playerResult: string;
  /** What the correct answer does with it. */
  readonly expectedResult: string;
}

export interface Verdict {
  readonly outcome: Outcome;
  /** 0..1. Exactly 1 when correct, 0 when incorrect/invalid; between for partial. */
  readonly score: number;
  readonly mistakes: readonly Mistake[];
  readonly counterexample: Counterexample | null;
  /** Player-facing lines, ordered most-important first. */
  readonly feedback: readonly string[];
  /** What to try next. Never the answer — a direction. */
  readonly nextStep: string | null;
}

const NO_MISTAKES: readonly Mistake[] = [];
const NO_FEEDBACK: readonly string[] = [];

export function correct(feedback: readonly string[] = []): Verdict {
  return {
    outcome: 'correct',
    score: 1,
    mistakes: NO_MISTAKES,
    counterexample: null,
    feedback,
    nextStep: null,
  };
}

export function incorrect(options: {
  readonly mistakes?: readonly Mistake[];
  readonly counterexample?: Counterexample | null;
  readonly feedback?: readonly string[];
  readonly nextStep?: string | null;
}): Verdict {
  return {
    outcome: 'incorrect',
    score: 0,
    mistakes: options.mistakes ?? NO_MISTAKES,
    counterexample: options.counterexample ?? null,
    feedback: options.feedback ?? NO_FEEDBACK,
    nextStep: options.nextStep ?? null,
  };
}

/**
 * Partial credit. Clamped to (0,1) exclusive: a partial verdict that scored 1 would be
 * indistinguishable from `correct`, and one that scored 0 from `incorrect`, which would
 * make progress gating ambiguous.
 */
export function partial(
  score: number,
  options: {
    readonly mistakes?: readonly Mistake[];
    readonly counterexample?: Counterexample | null;
    readonly feedback?: readonly string[];
    readonly nextStep?: string | null;
  },
): Verdict {
  const clamped = Math.min(0.99, Math.max(0.01, score));
  return {
    outcome: 'partial',
    score: clamped,
    mistakes: options.mistakes ?? NO_MISTAKES,
    counterexample: options.counterexample ?? null,
    feedback: options.feedback ?? NO_FEEDBACK,
    nextStep: options.nextStep ?? null,
  };
}

/**
 * Structurally unusable answer. Costs the player nothing — callers are expected not to
 * count an invalid verdict as a failed attempt, because it is not a wrong answer.
 */
export function invalid(problems: readonly string[], nextStep: string | null = null): Verdict {
  return {
    outcome: 'invalid',
    score: 0,
    mistakes: problems.map((message, i) => ({ code: 'structural', message, where: String(i) })),
    counterexample: null,
    feedback: problems,
    nextStep,
  };
}

/** True when the answer should count as solved for progression purposes. */
export function isSolved(verdict: Verdict): boolean {
  return verdict.outcome === 'correct';
}

/** True when this attempt should count against the player's attempt/hint budget. */
export function countsAsAttempt(verdict: Verdict): boolean {
  return verdict.outcome !== 'invalid';
}
