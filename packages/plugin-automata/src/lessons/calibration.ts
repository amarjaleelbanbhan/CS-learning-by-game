import type { Lesson } from '@arc/engine-lesson';

/**
 * "Calibration" (toa.dfa-ends-01) as declarative content.
 *
 * This is the first mission in the game and has no prerequisites, so it carries the
 * onboarding weight: it is where a player meets a state machine for the first time. The
 * curriculum entry marks it an explicit exception to the 90/10 problem-solving rule —
 * here the visualization IS the lesson — so the interactive stage is a `simulation`
 * rather than a `challenge`, and nothing is withheld.
 *
 * The `dfa-simulation` widget IS the existing DfaMission component: the graph, tape,
 * playback scrubber and string tester are unchanged. What moved out of it and into this
 * file is the narrative brief and objective, which the lesson now owns.
 */
export const calibrationLesson: Lesson = {
  id: 'lesson.toa.dfa-ends-01',
  version: 1,
  missionId: 'toa.dfa-ends-01',
  conceptId: 'dfa-fundamentals',
  title: 'Calibration',
  stages: [
    {
      id: 'brief',
      kind: 'mission-brief',
      title: 'Brief',
      blocks: [
        {
          kind: 'prose',
          text: 'Welcome to the floor, Engineer. Before you build anything, you calibrate — you watch a working machine run and learn to predict it.',
        },
        {
          kind: 'callout',
          tone: 'info',
          title: 'Objective',
          text: 'Feed binary strings to a fixed DFA and predict accept or reject before the tape finishes. Run one string it accepts to complete the calibration.',
        },
      ],
    },
    {
      id: 'story',
      kind: 'story',
      title: 'Story',
      blocks: [
        {
          kind: 'prose',
          text: "The reactor's outer doors run on the simplest circuit in the building. It reads an access code one symbol at a time, left to right, and it never looks back — no rewinding, no re-reading, no notes.",
        },
        {
          kind: 'prose',
          text: 'That constraint is not a limitation someone forgot to fix. It is the entire definition of the machine, and it is why the machine is fast enough to sit on a door.',
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
          text: 'A DFA has exactly one piece of memory: which state it is currently in. Not the string it has read, not how long it has been running — just the state.',
        },
        {
          kind: 'prose',
          text: 'So watch what the state does, not what the string says. Each symbol moves the machine along exactly one arrow, and where it stops when the tape runs out is the whole answer.',
        },
        {
          kind: 'math',
          latex: '\\delta : Q \\times \\Sigma \\to Q',
          alt: 'delta maps a state and a symbol to exactly one next state',
        },
        {
          kind: 'callout',
          tone: 'info',
          title: 'Exactly one',
          text: 'One arrow out of every state for every symbol — never zero, never two. That is what makes it deterministic, and it is why you can always predict where it lands.',
        },
      ],
    },
    {
      id: 'trace',
      kind: 'simulation',
      title: 'Trace it',
      requiresCompletion: true,
      blocks: [
        {
          kind: 'prose',
          text: 'This machine accepts binary strings ending in 01. Before you press Run, decide for yourself whether it should accept — then watch whether the machine agrees.',
        },
        {
          kind: 'widget',
          widgetId: 'dfa-simulation',
          alt: 'Interactive DFA simulator for strings ending in 01, with an animated state graph, an input tape, playback controls, and a field for testing your own binary strings.',
        },
        {
          kind: 'callout',
          tone: 'warning',
          title: 'Try to be wrong',
          text: 'The strings that teach you most are the ones where your prediction and the machine disagree. Test 100 and 010 — both contain 01, and neither is accepted.',
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
          text: 'You traced a machine that decides a language with three states and no memory of the past. Its states are not labels — each one stands for a fact worth remembering.',
        },
        {
          kind: 'callout',
          tone: 'success',
          title: 'What carries forward',
          text: 'Reading a DFA is asking "which state am I in, and is it accepting when the tape runs out?" Next you will build one, and the same question runs backwards.',
        },
      ],
    },
    {
      id: 'tricks',
      kind: 'memory-tricks',
      title: 'Memory tricks',
      blocks: [
        {
          kind: 'list',
          items: [
            'Read a state as a sentence about the past: "I have just seen a 0", "I have just completed 01".',
            'Acceptance is decided where you STOP, not where you have been. Passing through an accepting state proves nothing.',
            'Deterministic means no choices — trace with your finger and you will never need to guess.',
          ],
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
            'Reading "contains 01" instead of "ends in 01" — 010 contains it and is still rejected.',
            'Calling a string accepted because it lit up the accepting state mid-run.',
            'Forgetting the empty string is a real input: the machine never moves, so the start state decides it.',
          ],
        },
      ],
    },
  ],
};
