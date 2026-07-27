import { calibrationLesson } from '@arc/plugin-automata';
import { LessonRunner } from '@/components/lesson/LessonRunner';

export default function DfaEnds01Page() {
  return <LessonRunner lesson={calibrationLesson} />;
}
