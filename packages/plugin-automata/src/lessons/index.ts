import type { Lesson } from '@arc/engine-lesson';
import { perimeterSecurityLesson } from './perimeter-security.js';

/**
 * Declarative lessons for the Theory of Automata subject (FR-LESSON-2).
 *
 * Adding a topic means adding a file here and listing it below — no engine change and no
 * new React component, provided its interactivity is covered by an existing widget.
 */
export const LESSONS: readonly Lesson[] = [perimeterSecurityLesson];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** The lesson backing a campaign mission, if that mission has been migrated yet. */
export function lessonForMission(missionId: string): Lesson | undefined {
  return LESSONS.find((l) => l.missionId === missionId);
}

export { perimeterSecurityLesson };
