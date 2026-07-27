import type { Lesson } from './lesson.js';

/**
 * Stage progress and gating (FR-LESSON-3).
 *
 * `docs/02-ARCHITECTURE.md` names XState for this. Deliberate deviation: the lesson flow
 * is a linear cursor over an ordered array plus one "is this stage satisfied" predicate —
 * there are no concurrent regions, no history states, and no event-driven transitions
 * between named modes. A statechart would add a dependency and indirection without
 * preventing any state this reducer can't. XState remains the right tool for genuinely
 * mode-based machines (simulation playback: idle→playing→paused→done), and that choice
 * stands for those.
 *
 * Pure and serialisable, so progress can be persisted, synced, and unit-tested with no
 * framework and no mocking.
 */

export interface LessonProgress {
  /** Stage the learner is currently on. */
  readonly currentIndex: number;
  /** Stages explicitly satisfied — order-independent, so it survives content reordering. */
  readonly completedStageIds: readonly string[];
  /** Lesson version this progress was recorded against; see `isProgressStale`. */
  readonly lessonVersion: number;
}

export function initProgress(lesson: Lesson): LessonProgress {
  return { currentIndex: 0, completedStageIds: [], lessonVersion: lesson.version };
}

/**
 * True when stored progress was recorded against different content and should be reset
 * rather than trusted — stage ids may have been removed or reordered since.
 */
export function isProgressStale(lesson: Lesson, progress: LessonProgress): boolean {
  return progress.lessonVersion !== lesson.version;
}

export function isStageCompleted(progress: LessonProgress, stageId: string): boolean {
  return progress.completedStageIds.includes(stageId);
}

/**
 * A stage is unlocked when every PRECEDING stage that demands completion has been
 * completed. Stages that only need reading never block the learner.
 */
export function isStageUnlocked(lesson: Lesson, progress: LessonProgress, index: number): boolean {
  if (index <= 0) return true;
  if (index >= lesson.stages.length) return false;
  return lesson.stages
    .slice(0, index)
    .every((s) => !s.requiresCompletion || isStageCompleted(progress, s.id));
}

/** Marks a stage satisfied. Idempotent — completing twice is not an error. */
export function completeStage(progress: LessonProgress, stageId: string): LessonProgress {
  if (isStageCompleted(progress, stageId)) return progress;
  return { ...progress, completedStageIds: [...progress.completedStageIds, stageId] };
}

/** True when the learner may move on from the stage they are currently on. */
export function canAdvance(lesson: Lesson, progress: LessonProgress): boolean {
  const stage = lesson.stages[progress.currentIndex];
  if (!stage) return false;
  if (progress.currentIndex >= lesson.stages.length - 1) return false;
  return !stage.requiresCompletion || isStageCompleted(progress, stage.id);
}

/**
 * Advances one stage. A stage that only needs reading is completed implicitly by moving
 * past it, so "read it" and "finished it" cannot drift apart.
 */
export function advance(lesson: Lesson, progress: LessonProgress): LessonProgress {
  if (!canAdvance(lesson, progress)) return progress;
  const stage = lesson.stages[progress.currentIndex]!;
  const completed = completeStage(progress, stage.id);
  return { ...completed, currentIndex: completed.currentIndex + 1 };
}

/** Steps back. Never un-completes anything — revisiting a stage must be free. */
export function goBack(progress: LessonProgress): LessonProgress {
  if (progress.currentIndex <= 0) return progress;
  return { ...progress, currentIndex: progress.currentIndex - 1 };
}

/** Jumps to any unlocked stage (the stage rail). Refuses locked targets. */
export function jumpTo(lesson: Lesson, progress: LessonProgress, index: number): LessonProgress {
  if (index < 0 || index >= lesson.stages.length) return progress;
  if (!isStageUnlocked(lesson, progress, index)) return progress;
  return { ...progress, currentIndex: index };
}

/** A lesson is finished once every completion-gated stage is done. */
export function isLessonComplete(lesson: Lesson, progress: LessonProgress): boolean {
  return lesson.stages
    .filter((s) => s.requiresCompletion)
    .every((s) => isStageCompleted(progress, s.id));
}

/** Fraction of gated stages completed, 0..1 — 1 when a lesson gates nothing. */
export function completionRatio(lesson: Lesson, progress: LessonProgress): number {
  const gated = lesson.stages.filter((s) => s.requiresCompletion);
  if (gated.length === 0) return 1;
  const done = gated.filter((s) => isStageCompleted(progress, s.id)).length;
  return done / gated.length;
}
