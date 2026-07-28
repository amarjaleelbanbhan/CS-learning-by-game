import { subsetConstructionLesson } from '@arc/plugin-automata';
import { LessonRunner } from '@/components/lesson/LessonRunner';

export default function NfaToDfaPage() {
  return <LessonRunner lesson={subsetConstructionLesson} />;
}
