import { invalid, type Verdict } from './verdict.js';

/**
 * The grader contract — the extension point that lets the game cover CFG, PDA, Turing
 * machines and proofs without any of them touching a shared switch statement.
 *
 * The pipeline is fixed:
 *
 *     raw → normalize → validate → grade → Verdict
 *
 * Each step exists because it answers a different question, and collapsing them is what
 * produces the "wrong answer" lie:
 *
 *  - **normalize** — *can this even be read?* Turns whatever the UI produced into a typed
 *    answer. Returning `null` means uninterpretable (a malformed regex, an empty form),
 *    which is a typo, not a misconception.
 *  - **validate** — *is this a complete answer?* Structural problems that make grading
 *    meaningless (a DFA with no start state). Distinct from being wrong.
 *  - **grade** — *is it right, and if not, why specifically?*
 *
 * `TAnswer` is what the player produced; `TSpec` is the hidden problem definition (the
 * reference automaton, the target language, the accepted set of choices).
 */
export interface Grader<TAnswer, TSpec> {
  /** Stable id, referenced from declarative task content. */
  readonly id: string;
  /**
   * Parse raw UI output into a typed answer. Must be total — never throw. Return null for
   * input that cannot be interpreted at all.
   */
  normalize(raw: unknown): TAnswer | null;
  /**
   * Structural problems that block grading. Empty array means gradeable. These are shown
   * to the player as "finish this", not "you got it wrong".
   */
  validate(answer: TAnswer, spec: TSpec): readonly string[];
  /** Decide correctness and diagnose. Only called on a normalized, valid answer. */
  grade(answer: TAnswer, spec: TSpec): Verdict;
}

/**
 * Runs the full pipeline. This is the only function missions should call — going straight
 * to `grade()` skips normalization and validation, which is exactly how a grader ends up
 * throwing on a half-filled form.
 */
export function assess<TAnswer, TSpec>(
  grader: Grader<TAnswer, TSpec>,
  raw: unknown,
  spec: TSpec,
): Verdict {
  const answer = grader.normalize(raw);
  if (answer === null) {
    return invalid(
      ["That answer couldn't be read."],
      'Check the format and try again — this does not count as an attempt.',
    );
  }
  const problems = grader.validate(answer, spec);
  if (problems.length > 0) return invalid(problems, 'Finish the answer, then submit again.');

  // A grader that throws is an authoring bug (usually a spec missing a field it reads).
  // Without this the exception escapes into the click handler and the player sees
  // NOTHING happen — no verdict, no error, a dead button. Failing loudly as an invalid
  // verdict keeps the player informed and, crucially, does not charge them an attempt
  // for our mistake.
  try {
    return grader.grade(answer, spec);
  } catch (error) {
    return invalid(
      [
        `This task could not be graded (${error instanceof Error ? error.message : 'unknown error'}).`,
      ],
      'This is a problem with the task, not with your answer.',
    );
  }
}

/**
 * Registry of graders by id, so declarative task content can name a grader the same way
 * lesson content names a widget.
 *
 * Deliberately typed loosely at the boundary: a heterogeneous map cannot preserve each
 * grader's answer/spec types, and the alternative (a giant discriminated union of every
 * answer shape in the game) is precisely the closed-set design this interface exists to
 * avoid. Type safety is preserved at the point of use, where a mission knows its own
 * grader's concrete types.
 */
export interface AnyGrader {
  readonly id: string;
  // `unknown` return, `never` parameters: return types are covariant and parameter types
  // contravariant, so this is the one shape every concrete Grader<T, S> is assignable to
  // without a cast. Writing `Grader<never, never>` instead fails, because a grader whose
  // normalize returns `DFA | null` is not assignable to one returning `null`.
  normalize(raw: unknown): unknown;
  validate(answer: never, spec: never): readonly string[];
  grade(answer: never, spec: never): Verdict;
}

export class GraderRegistry {
  private readonly graders = new Map<string, AnyGrader>();

  register(grader: AnyGrader): void {
    if (this.graders.has(grader.id)) {
      throw new Error(`Grader "${grader.id}" is already registered`);
    }
    this.graders.set(grader.id, grader);
  }

  get(id: string): AnyGrader | undefined {
    return this.graders.get(id);
  }

  has(id: string): boolean {
    return this.graders.has(id);
  }

  ids(): readonly string[] {
    return [...this.graders.keys()].sort();
  }
}
