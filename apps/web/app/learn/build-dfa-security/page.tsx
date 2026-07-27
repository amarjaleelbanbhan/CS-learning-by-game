import { perimeterSecurityLesson } from '@arc/plugin-automata';
import { LessonRunner } from '@/components/lesson/LessonRunner';

/**
 * Reference migration (FR-LESSON-2): this route no longer renders a bespoke mission
 * component. It renders declarative content through the shared LessonRunner, and the
 * interactive builder is reached as a registered widget from that content.
 */
export default function BuildDfaSecurityPage() {
  return <LessonRunner lesson={perimeterSecurityLesson} />;
}
