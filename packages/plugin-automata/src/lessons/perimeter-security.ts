import type { Lesson } from '@arc/engine-lesson';

/**
 * "Perimeter Security" (toa.build.dfa-ends-01) as declarative content — the reference
 * migration proving FR-LESSON-2.
 *
 * The interactive core is unchanged: the `dfa-construction` widget IS the existing
 * DfaConstructionMission component, with its grading, hint ladder, ARIA debrief and
 * rewards intact. What this adds is the FR-LESSON-1 stage structure the mission never
 * had — brief, intuition, challenge, mistakes, summary — expressed as data.
 *
 * Prose is written fresh for this lesson; the objective and hint framing follow the
 * curriculum entry in `../curriculum/missions.ts` so content and campaign agree.
 */
export const perimeterSecurityLesson: Lesson = {
  id: 'lesson.toa.build.dfa-ends-01',
  version: 1,
  missionId: 'toa.build.dfa-ends-01',
  conceptId: 'dfa-language-design',
  title: 'Perimeter Security',
  stages: [
    {
      id: 'brief',
      kind: 'mission-brief',
      title: 'Brief',
      blocks: [
        {
          kind: 'prose',
          text: "Engineer — the reactor's perimeter only unlocks for binary access codes ending in 01. Every other code must be refused. Build the recognition circuit.",
        },
        {
          kind: 'callout',
          tone: 'info',
          title: 'Objective',
          text: 'On a blank canvas, build a DFA that accepts exactly the binary strings ending in "01". No automaton is given — this one is yours to design.',
        },
      ],
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Intuition',
      blocks: [
        {
          kind: 'prose',
          text: 'A DFA has no memory beyond the state it is currently in. So the only question that matters is: what is the least you must remember about everything read so far?',
        },
        {
          kind: 'prose',
          text: 'You do not need the whole code. To decide whether it ends in 01, you only need to know how much of "01" you have just seen.',
        },
        {
          kind: 'list',
          items: [
            'Nothing useful yet — the last symbols cannot start a match.',
            'Just saw a 0 — a 1 now would complete "01".',
            'Just completed "01" — accepting, for now.',
          ],
        },
        {
          kind: 'callout',
          tone: 'warning',
          title: 'The catch',
          text: 'Acceptance is judged only at the END of the input. Passing through the accepting state mid-string means nothing if later symbols move you out of it.',
        },
      ],
    },
    {
      id: 'build',
      kind: 'challenge',
      title: 'Build it',
      requiresCompletion: true,
      blocks: [
        {
          kind: 'prose',
          text: 'Add states, mark one as the start, choose which are accepting, and draw a transition for every symbol. Test codes against your machine before you submit.',
        },
        {
          kind: 'widget',
          widgetId: 'dfa-construction',
          alt: 'Interactive DFA construction canvas for the Perimeter Security mission, with a string tester, a hint ladder, and a submit button graded by language equivalence.',
        },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      title: 'Summary',
      blocks: [
        {
          kind: 'prose',
          text: 'You built a machine whose states ARE its memory. Three states were enough because only three facts about the past can change the answer.',
        },
        {
          kind: 'callout',
          tone: 'success',
          title: 'What carries forward',
          text: 'Every DFA you design from here starts with the same question: what is the smallest set of facts I must remember? That question is the whole skill.',
        },
      ],
    },
    {
      id: 'mistakes',
      kind: 'common-mistakes',
      title: 'Common mistakes',
      blocks: [
        {
          kind: 'list',
          items: [
            'Leaving a state without a transition for some symbol — a DFA needs one for every symbol, every time.',
            'Marking the wrong state accepting: acceptance is about where you END, not where you have been.',
            'Forgetting that reading a second 0 keeps you "one 0 in", rather than resetting you to nothing.',
          ],
        },
      ],
    },
  ],
};
