/**
 * @arc/engine-lesson — the declarative lesson engine (FR-LESSON-1..4).
 *
 * A lesson is DATA, not code: an ordered list of stages holding content blocks, with
 * interactive widgets referenced by id. Adding a topic means adding validated content,
 * not writing another bespoke React component — which is the whole point of FR-LESSON-2
 * and the bottleneck this package exists to remove.
 *
 * Pure TypeScript with no dependencies: no React, no schema library, no state-machine
 * library. Validation follows the same `validateX(): string[]` shape already used by
 * engine-game and engine-progress, so it runs in CI with nothing to install.
 */
export const PACKAGE_NAME = '@arc/engine-lesson' as const;

export type {
  JsonValue,
  CalloutTone,
  ProseBlock,
  CalloutBlock,
  MathBlock,
  ListBlock,
  WidgetBlock,
  ContentBlock,
} from './content.js';
export { CALLOUT_TONES, referencedWidgetIds, validateContentBlock } from './content.js';

export type { TaskVerb, Task } from './task.js';
export {
  TASK_VERBS,
  UNGRADED_VERBS,
  VERB_XP_MULTIPLIER,
  taskXp,
  isGraded,
  validateTask,
  referencedGraderIds,
} from './task.js';

export type { StageKind, LessonStage, Lesson } from './lesson.js';
export {
  STAGE_FLOW,
  stageIndex,
  stageById,
  lessonWidgetIds,
  validateLesson,
  validateLessonWidgets,
} from './lesson.js';

export type { LessonProgress } from './progress.js';
export {
  initProgress,
  isProgressStale,
  isStageCompleted,
  isStageUnlocked,
  completeStage,
  canAdvance,
  advance,
  goBack,
  jumpTo,
  isLessonComplete,
  completionRatio,
} from './progress.js';
