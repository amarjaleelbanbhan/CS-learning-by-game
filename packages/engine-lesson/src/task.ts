import type { JsonValue } from './content.js';

/**
 * A Task is one thing the player *does*, bound to a grader that decides whether they did
 * it. It is the join between the two engines: `engine-lesson` owns what is presented,
 * `engine-assessment` owns what is correct, and a Task names both without either engine
 * depending on the other.
 *
 * This is what makes a mission authorable as data. Previously the only way to add a
 * graded interaction was to write a React component that computed correctness inline;
 * with a Task, a new mission is a content file naming an existing grader.
 */

/**
 * The closed set of player verbs from the design bible.
 *
 * Deliberately closed: a new mission picks a verb, it does not invent one. If a mission
 * genuinely needs a thirteenth verb, that is a design decision to be made once, here —
 * not an ad-hoc component in `apps/web`.
 *
 * `observe` and `experiment` carry no grader by design: they are ungraded stages, and the
 * validator below enforces that they can never be a completion criterion. That rule is
 * the thing preventing "watch an animation, collect XP" from reappearing.
 */
export const TASK_VERBS = [
  'observe',
  'predict',
  'complete',
  'construct',
  'simulate',
  'debug',
  'draw',
  'convert',
  'classify',
  'prove',
  'experiment',
  'boss',
] as const;

export type TaskVerb = (typeof TASK_VERBS)[number];

/** Verbs that produce no verdict and therefore can never gate progress. */
export const UNGRADED_VERBS: readonly TaskVerb[] = ['observe', 'experiment'];

/**
 * XP weighting by agency (design bible §8). A player who predicts an outcome earns less
 * than one who constructs a machine; watching earns nothing at all.
 */
export const VERB_XP_MULTIPLIER: Readonly<Record<TaskVerb, number>> = {
  observe: 0,
  experiment: 0,
  predict: 0.6,
  complete: 0.8,
  simulate: 0.8,
  construct: 1,
  debug: 1,
  draw: 1,
  convert: 1,
  classify: 1.2,
  prove: 1.2,
  boss: 1.5,
};

export interface Task {
  readonly id: string;
  readonly verb: TaskVerb;
  /** What the player is asked to do. Never a definition — an instruction. */
  readonly prompt: string;
  /**
   * Which grader decides this task, by id (e.g. 'dfa-equivalence'). Omitted only for
   * ungraded verbs.
   */
  readonly graderId?: string;
  /**
   * The problem definition handed to the grader.
   *
   * Held as an opaque reference id rather than an inline object because a spec often
   * contains Maps and Sets (a reference DFA), which are not JSON-serialisable — and
   * lesson content must stay serialisable so it can live in `missions.content jsonb`.
   * The host app resolves this id to a real spec, exactly as it resolves widget ids to
   * components.
   */
  readonly specRef?: string;
  /** Plain JSON tweaks layered over the resolved spec (e.g. which input to predict). */
  readonly params?: Readonly<Record<string, JsonValue>>;
  /** Widget that collects the answer. Resolved by the host, like any lesson widget. */
  readonly widgetId?: string;
  /** Base XP before the verb multiplier and hint penalties are applied. */
  readonly baseXp: number;
  /** Ordered hints, least revealing first. Unlocked by failed attempts, never on demand. */
  readonly hints?: readonly string[];
}

/** XP actually awarded, after agency weighting and hint use. */
export function taskXp(task: Task, hintsUsed = 0): number {
  const earned = task.baseXp * VERB_XP_MULTIPLIER[task.verb];
  // Each hint costs 20%, floored at 40% — a player who needed help still learned, and
  // punishing them below that would make quitting the better move.
  const penalty = Math.max(0.4, 1 - 0.2 * Math.max(0, hintsUsed));
  return Math.round(earned * penalty);
}

export function isGraded(task: Task): boolean {
  return !UNGRADED_VERBS.includes(task.verb);
}

/**
 * Structural validation, run in CI over all authored content.
 *
 * The rule that matters most here is the last one: an ungraded verb may not carry a
 * grader, and a graded verb must. That is what makes "no XP for watching" a property the
 * build enforces rather than a convention reviewers have to remember.
 */
export function validateTask(task: Task, where: string): string[] {
  const errors: string[] = [];
  const at = `${where}/task ${task.id || '(unnamed)'}`;

  if (task.id.trim().length === 0) errors.push(`${at}: task id must not be empty`);
  if (task.prompt.trim().length === 0) errors.push(`${at}: prompt must not be empty`);
  if (!TASK_VERBS.includes(task.verb)) errors.push(`${at}: unknown verb "${task.verb}"`);
  if (!Number.isFinite(task.baseXp) || task.baseXp < 0) {
    errors.push(`${at}: baseXp must be a non-negative number`);
  }

  if (isGraded(task)) {
    if (task.graderId === undefined || task.graderId.trim().length === 0) {
      errors.push(`${at}: verb "${task.verb}" is graded, so graderId is required`);
    }
    if (task.widgetId === undefined || task.widgetId.trim().length === 0) {
      errors.push(`${at}: verb "${task.verb}" needs a widgetId to collect the answer`);
    }
  } else {
    if (task.graderId !== undefined) {
      errors.push(`${at}: verb "${task.verb}" is ungraded and must not name a grader`);
    }
    if (task.baseXp > 0) {
      errors.push(
        `${at}: verb "${task.verb}" cannot award XP — passive stages are never a completion criterion`,
      );
    }
  }

  return errors;
}

/** Every grader id referenced by a set of tasks, for registry validation in CI. */
export function referencedGraderIds(tasks: readonly Task[]): readonly string[] {
  return [...new Set(tasks.flatMap((t) => (t.graderId === undefined ? [] : [t.graderId])))].sort();
}
