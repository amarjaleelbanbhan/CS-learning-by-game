import { referencedWidgetIds, validateContentBlock, type ContentBlock } from './content.js';
import { isGraded, validateTask, type Task } from './task.js';

/**
 * Declarative lesson schema (FR-LESSON-1, FR-LESSON-2).
 *
 * A lesson is data: an ordered list of stages, each holding content blocks. Adding a
 * topic must not require engine changes or a bespoke React component — that is the whole
 * point of FR-LESSON-2, and the reason this package exists.
 */

/**
 * The canonical lesson flow from FR-LESSON-1, in order. A lesson uses a SUBSET of these
 * (few topics warrant a boss battle), but never invents a stage and never reorders them:
 * a consistent shape is what lets one renderer serve every topic.
 */
export const STAGE_FLOW = [
  'mission-brief',
  'story',
  'intuition',
  'visualization',
  'animation',
  'simulation',
  'sandbox',
  'guided-practice',
  'challenge',
  'boss-battle',
  'summary',
  'memory-tricks',
  'common-mistakes',
  'revision',
  'unlock-reward',
] as const;

export type StageKind = (typeof STAGE_FLOW)[number];

export interface LessonStage {
  readonly id: string;
  readonly kind: StageKind;
  readonly title: string;
  readonly blocks: readonly ContentBlock[];
  /**
   * When true the learner must explicitly complete this stage (solve the exercise,
   * finish the simulation) before the next unlocks — FR-LESSON-3. When false or absent,
   * reading it is enough and advancing completes it.
   */
  readonly requiresCompletion?: boolean;
  /**
   * Graded interactions on this stage. A stage may hold several (predict, then construct),
   * and a stage with `requiresCompletion` is satisfied when all of its graded tasks are.
   */
  readonly tasks?: readonly Task[];
}

export interface Lesson {
  readonly id: string;
  /** Bumped when content changes incompatibly, so stored progress can be invalidated. */
  readonly version: number;
  /** The campaign mission this lesson backs — ties rewards/unlocks to existing systems. */
  readonly missionId: string;
  readonly conceptId: string;
  readonly title: string;
  readonly stages: readonly LessonStage[];
}

export function stageIndex(lesson: Lesson, stageId: string): number {
  return lesson.stages.findIndex((s) => s.id === stageId);
}

export function stageById(lesson: Lesson, stageId: string): LessonStage | undefined {
  return lesson.stages.find((s) => s.id === stageId);
}

/** Every widget id the lesson references, deduped — used to check the host registry. */
export function lessonWidgetIds(lesson: Lesson): readonly string[] {
  return [...new Set(lesson.stages.flatMap((s) => referencedWidgetIds(s.blocks)))];
}

/**
 * Validates a lesson's structure. Returns human-readable errors; empty means valid.
 * Mirrors `validateUnlockGraph` / `validateCareerLadder` so content validation looks the
 * same everywhere in this codebase, and so it can run in CI with no runtime dependency.
 */
export function validateLesson(lesson: Lesson): string[] {
  const errors: string[] = [];

  if (!lesson.id.trim()) errors.push('lesson id must not be empty');
  if (!lesson.missionId.trim()) errors.push(`lesson "${lesson.id}": missionId must not be empty`);
  if (!lesson.conceptId.trim()) errors.push(`lesson "${lesson.id}": conceptId must not be empty`);
  if (!lesson.title.trim()) errors.push(`lesson "${lesson.id}": title must not be empty`);
  if (!Number.isInteger(lesson.version) || lesson.version < 1) {
    errors.push(`lesson "${lesson.id}": version must be a positive integer`);
  }
  if (lesson.stages.length === 0)
    errors.push(`lesson "${lesson.id}": must have at least one stage`);

  const seen = new Set<string>();
  let lastFlowPos = -1;

  for (const stage of lesson.stages) {
    const where = `lesson "${lesson.id}" stage "${stage.id}"`;

    if (!stage.id.trim()) errors.push(`${where}: stage id must not be empty`);
    if (seen.has(stage.id)) errors.push(`${where}: duplicate stage id`);
    seen.add(stage.id);

    if (!stage.title.trim()) errors.push(`${where}: title must not be empty`);

    const flowPos = STAGE_FLOW.indexOf(stage.kind);
    if (flowPos === -1) {
      errors.push(`${where}: unknown stage kind "${stage.kind}"`);
    } else {
      // Out-of-order stages are a content bug, not a style preference: the flow is the
      // pedagogy (you cannot revise before you have seen the intuition).
      if (flowPos < lastFlowPos) {
        errors.push(`${where}: kind "${stage.kind}" appears out of FR-LESSON-1 flow order`);
      }
      lastFlowPos = flowPos;
    }

    if (stage.blocks.length === 0) errors.push(`${where}: must have at least one content block`);
    for (const [i, block] of stage.blocks.entries()) {
      errors.push(...validateContentBlock(block, `${where} block ${i}`));
    }

    const tasks = stage.tasks ?? [];
    const taskIds = new Set<string>();
    for (const task of tasks) {
      if (taskIds.has(task.id)) errors.push(`${where}: duplicate task id "${task.id}"`);
      taskIds.add(task.id);
      errors.push(...validateTask(task, where));
    }

    // The anti-"watch a video" rule, enforced by the build rather than by review: a stage
    // may only gate progress if the player can actually do something gradeable on it.
    // A widget alone is not enough — the NFA→DFA lab had a widget and completed itself
    // when the animation ended.
    if (stage.requiresCompletion === true && tasks.length > 0 && !tasks.some(isGraded)) {
      errors.push(
        `${where}: requiresCompletion is set but every task is ungraded — passive stages cannot gate progress`,
      );
    }
  }

  return errors;
}

/**
 * Checks every widget the lesson references actually exists in the host's registry.
 * Kept separate from `validateLesson` because the registry is a host concern — the
 * engine stays pure and framework-free, while the app can still fail fast in tests.
 */
export function validateLessonWidgets(lesson: Lesson, registered: Iterable<string>): string[] {
  const available = new Set(registered);
  return lessonWidgetIds(lesson)
    .filter((id) => !available.has(id))
    .map((id) => `lesson "${lesson.id}": references unregistered widget "${id}"`);
}
