import type { Grader } from '../grader.js';
import { correct, incorrect, partial, type Mistake } from '../verdict.js';

/**
 * Graders for answers that are compared against a known key rather than executed.
 *
 * These exist so that classification, ordering and matching tasks — the drag-and-drop and
 * puzzle mechanics — go through the same pipeline as automaton grading, producing the
 * same `Verdict` shape. They are deliberately NOT a licence to write quizzes: per the
 * design bible, multiple choice is a *supporting* verb (Classify, Predict), never the
 * primary interaction of a mission.
 */

function toStringArray(raw: unknown): string[] | null {
  if (typeof raw === 'string') return [raw];
  if (!Array.isArray(raw)) return null;
  return raw.every((v) => typeof v === 'string') ? [...(raw as string[])] : null;
}

export interface ChoiceSpec {
  /** Ids of every option that must be selected. */
  readonly correctIds: readonly string[];
  /** When true, selecting some-but-not-all scores partial credit. */
  readonly allowPartial?: boolean;
  /** Per-option explanation shown when that option is chosen wrongly. */
  readonly rationale?: Readonly<Record<string, string>>;
}

/**
 * Single- and multi-select in one grader: "single" is just a key of length 1. Order never
 * matters, and duplicate selections are collapsed.
 */
export const choiceGrader: Grader<readonly string[], ChoiceSpec> = {
  id: 'choice',
  normalize: (raw) => {
    const values = toStringArray(raw);
    return values === null ? null : [...new Set(values)];
  },
  validate: (answer) => (answer.length === 0 ? ['Nothing selected yet.'] : []),
  grade: (answer, spec) => {
    const key = new Set(spec.correctIds);
    const chosen = new Set(answer);
    const missed = [...key].filter((id) => !chosen.has(id));
    const wrong = [...chosen].filter((id) => !key.has(id));

    if (missed.length === 0 && wrong.length === 0) return correct(['Correct.']);

    const mistakes: Mistake[] = [
      ...wrong.map((id) => ({
        code: 'incorrect-selection',
        message: spec.rationale?.[id] ?? 'This option does not belong.',
        where: id,
      })),
      ...missed.map((id) => ({
        code: 'missed-selection',
        message: spec.rationale?.[id] ?? 'This option belongs but was not selected.',
        where: id,
      })),
    ];

    const feedback =
      wrong.length > 0 && missed.length > 0
        ? [`${wrong.length} selected that shouldn't be, and ${missed.length} missed.`]
        : wrong.length > 0
          ? [`${wrong.length} of your selections don't belong.`]
          : [`You missed ${missed.length}.`];

    // Partial credit only when the player got something right AND nothing wrong —
    // rewarding a scattershot "select everything" answer would teach the wrong lesson.
    const hits = key.size - missed.length;
    if (spec.allowPartial === true && wrong.length === 0 && hits > 0) {
      return partial(hits / key.size, {
        mistakes,
        feedback,
        nextStep: 'Keep going — some are still missing.',
      });
    }
    return incorrect({
      mistakes,
      feedback,
      nextStep: 'Re-read the prompt and check each option against it.',
    });
  },
};

export interface NumericSpec {
  readonly expected: number;
  /** Absolute tolerance. Defaults to 0 — most automata answers are exact counts. */
  readonly tolerance?: number;
  /** Nudge shown when the answer is close but not right. */
  readonly nearMissHint?: string;
}

export const numericGrader: Grader<number, NumericSpec> = {
  id: 'numeric',
  normalize: (raw) => {
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  },
  validate: () => [],
  grade: (answer, spec) => {
    const tolerance = spec.tolerance ?? 0;
    const delta = answer - spec.expected;
    if (Math.abs(delta) <= tolerance) return correct(['Correct.']);
    const direction = delta > 0 ? 'too high' : 'too low';
    return incorrect({
      mistakes: [
        { code: delta > 0 ? 'overestimate' : 'underestimate', message: `Answer is ${direction}.` },
      ],
      feedback: [`Not quite — your answer is ${direction}.`],
      nextStep: spec.nearMissHint ?? 'Work through the construction step by step and recount.',
    });
  },
};

export interface OrderingSpec {
  /** The one correct sequence of item ids. */
  readonly correctOrder: readonly string[];
}

/**
 * Ordering puzzles (derivation steps, algorithm stages, proof steps). Scored by how many
 * items sit in their correct absolute position, so a nearly-right sequence reads as
 * nearly right rather than as a flat failure.
 */
export const orderingGrader: Grader<readonly string[], OrderingSpec> = {
  id: 'ordering',
  normalize: toStringArray,
  validate: (answer, spec) => {
    if (answer.length !== spec.correctOrder.length) {
      return [`Expected ${spec.correctOrder.length} items in the sequence, got ${answer.length}.`];
    }
    if (new Set(answer).size !== answer.length) return ['An item appears more than once.'];
    const known = new Set(spec.correctOrder);
    const unknown = answer.filter((id) => !known.has(id));
    return unknown.length > 0 ? [`Unrecognised item: ${unknown[0]}`] : [];
  },
  grade: (answer, spec) => {
    const misplaced = answer
      .map((id, i) => ({ id, i }))
      .filter(({ id, i }) => spec.correctOrder[i] !== id);

    if (misplaced.length === 0) return correct(['Correct order.']);

    const mistakes = misplaced.map(({ id, i }) => ({
      code: 'wrong-position',
      message: `"${id}" is in position ${i + 1} but belongs elsewhere.`,
      where: id,
    }));
    const placed = answer.length - misplaced.length;
    const feedback = [`${placed} of ${answer.length} are in the right place.`];

    return placed > 0
      ? partial(placed / answer.length, {
          mistakes,
          feedback,
          nextStep: 'Fix the ones flagged and resubmit.',
        })
      : incorrect({ mistakes, feedback, nextStep: 'Start from the first step and work forward.' });
  },
};

export interface MatchingSpec {
  /** left id -> the single right id it pairs with. */
  readonly pairs: Readonly<Record<string, string>>;
}

/** Drag-and-drop matching (machine ↔ language, grammar ↔ parse tree, class ↔ example). */
export const matchingGrader: Grader<Readonly<Record<string, string>>, MatchingSpec> = {
  id: 'matching',
  normalize: (raw) => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const entries = Object.entries(raw as Record<string, unknown>);
    return entries.every(([, v]) => typeof v === 'string')
      ? Object.fromEntries(entries as [string, string][])
      : null;
  },
  validate: (answer, spec) => {
    const expected = Object.keys(spec.pairs).length;
    const given = Object.keys(answer).length;
    return given < expected ? [`${expected - given} still unmatched.`] : [];
  },
  grade: (answer, spec) => {
    const keys = Object.keys(spec.pairs);
    const wrong = keys.filter((left) => answer[left] !== spec.pairs[left]);
    if (wrong.length === 0) return correct(['All matched correctly.']);

    const mistakes = wrong.map((left) => ({
      code: 'wrong-match',
      message: `"${left}" is not paired correctly.`,
      where: left,
    }));
    const rightCount = keys.length - wrong.length;
    const feedback = [`${rightCount} of ${keys.length} pairs are correct.`];

    return rightCount > 0
      ? partial(rightCount / keys.length, {
          mistakes,
          feedback,
          nextStep: 'Re-check the flagged pairs.',
        })
      : incorrect({ mistakes, feedback, nextStep: 'Work from the ones you are most sure about.' });
  },
};
