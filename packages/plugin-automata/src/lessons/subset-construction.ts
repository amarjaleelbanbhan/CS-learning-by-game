import type { Lesson } from '@arc/engine-lesson';

/**
 * "NFA → DFA" (toa.nfa-to-dfa) — rebuilt from a passive spectacle into a real mission.
 *
 * The original shipped a beautiful subset-construction animation and awarded 250 XP from
 * a `useEffect` when the playback reached its final frame. The player could not fail, and
 * pressing play was the entire interaction. That is the exact anti-pattern the design
 * bible forbids, and lesson validation now rejects content of that shape.
 *
 * The animation is NOT removed — it is moved to where it belongs. It is now the REWARD
 * for having predicted and built, rather than the substitute for doing so:
 *
 *     observe → predict → experiment → construct → verify → reveal → diagnose → master
 *
 * XP comes from the graded tasks (0.6x for predictions, 1x for construction), so the
 * total is earned by decisions rather than by reaching the end of a video.
 */
export const subsetConstructionLesson: Lesson = {
  id: 'lesson.toa.nfa-to-dfa',
  version: 1,
  missionId: 'toa.nfa-to-dfa',
  conceptId: 'nfa-to-dfa-subset-construction',
  title: 'NFA → DFA',
  stages: [
    {
      id: 'brief',
      kind: 'mission-brief',
      title: 'Brief',
      blocks: [
        {
          kind: 'prose',
          text: 'The Research Archive runs on a nondeterministic scanner. It works, but nothing in the reactor can execute it — hardware cannot guess. Your job is to rebuild it as a machine that always knows exactly where it is.',
        },
        {
          kind: 'callout',
          tone: 'info',
          title: 'Objective',
          text: 'Predict what determinizing this NFA will cost, then build the equivalent DFA yourself. The worked construction unlocks only after you have committed.',
        },
      ],
    },
    {
      id: 'observe',
      kind: 'visualization',
      title: 'The machine',
      blocks: [
        {
          kind: 'prose',
          text: 'Here is the scanner. It accepts binary strings ending in 01, but it gets there by guessing — from the start state it can stay put or jump ahead, and it accepts if ANY path works out.',
        },
        {
          kind: 'prose',
          text: 'Run a few strings. Watch how many states are lit at once. That set of simultaneously-active states is the thing you are about to give a name to.',
        },
      ],
    },
    {
      id: 'predict',
      kind: 'guided-practice',
      title: 'Predict',
      requiresCompletion: true,
      blocks: [
        {
          kind: 'prose',
          text: 'Before you build anything, commit to a number. Determinizing replaces every reachable SET of NFA states with a single DFA state.',
        },
        {
          kind: 'callout',
          tone: 'warning',
          title: 'Commit first',
          text: 'Guessing and then checking teaches more than reading the answer. A wrong prediction here costs you nothing but tells you exactly which intuition to fix.',
        },
      ],
      tasks: [
        {
          id: 'predict-state-count',
          verb: 'predict',
          prompt:
            'How many states will the determinized DFA have? Count only the subsets that are actually reachable.',
          graderId: 'numeric',
          specRef: 'nfa-ends-in-01-state-count',
          widgetId: 'numeric',
          params: { label: 'Reachable DFA states' },
          baseXp: 80,
          hints: [
            'Start from the ε-closure of the NFA start state. That set is your first DFA state.',
            'From each set, follow every symbol and collect where you land. New set means new DFA state.',
            'An NFA with n states has 2^n possible subsets, but almost none of them are reachable. Trace it and count only what you actually visit.',
          ],
        },
        {
          id: 'predict-membership',
          verb: 'predict',
          prompt:
            'Before determinizing — does this NFA accept "1101"? Decide from the machine, not by trial.',
          graderId: 'membership-prediction',
          specRef: 'nfa-ends-in-01-machine',
          widgetId: 'predict-accept-reject',
          params: { input: '1101' },
          baseXp: 60,
          hints: [
            'An NFA accepts if ANY path ends in an accepting state — you only need one to work.',
            'Read the last two symbols. What does this machine actually care about?',
          ],
        },
      ],
    },
    {
      id: 'construct',
      kind: 'challenge',
      title: 'Build it',
      requiresCompletion: true,
      blocks: [
        {
          kind: 'prose',
          text: 'Now build the deterministic equivalent. Each of your states stands for a SET of NFA states — name them accordingly, so you can see the construction in your own machine.',
        },
        {
          kind: 'callout',
          tone: 'info',
          title: 'Graded by language, not by shape',
          text: 'Any DFA accepting exactly the same strings passes. You do not have to match the reference state-for-state — if your machine is right, it is right.',
        },
      ],
      tasks: [
        {
          id: 'build-dfa',
          verb: 'construct',
          prompt:
            'Build a DFA over {0, 1} that accepts exactly the strings this NFA accepts. Test before you submit.',
          graderId: 'dfa-equivalence',
          specRef: 'nfa-ends-in-01-determinized',
          widgetId: 'dfa-builder',
          params: { alphabet: ['0', '1'], allowRename: true },
          baseXp: 200,
          hints: [
            'Your start state is the ε-closure of the NFA start state.',
            'For each state and each symbol, ask: from every NFA state in this set, where can I go? That union is the target.',
            'A set containing any NFA accepting state makes that DFA state accepting.',
          ],
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
          text: 'Nondeterminism buys no extra power — only brevity. Every NFA has an equivalent DFA, and the construction is mechanical: name each reachable set of states, and the guessing disappears.',
        },
        {
          kind: 'callout',
          tone: 'success',
          title: 'What carries forward',
          text: 'This is why regular languages have three interchangeable notations. Regex, NFA and DFA all describe the same class, and you can always convert.',
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
            'Forgetting the ε-closure when forming a new subset — the set is not just where the symbol takes you, but everything reachable for free afterwards.',
            'Building all 2^n subsets instead of only the reachable ones. Most subsets never appear.',
            'Marking a subset accepting only when ALL its NFA states accept. One is enough.',
            'Dropping the empty set. It is a real DFA state — the dead state — and it needs transitions too.',
          ],
        },
      ],
    },
    {
      id: 'reveal',
      kind: 'unlock-reward',
      title: 'Reveal',
      blocks: [
        {
          kind: 'prose',
          text: 'You committed, then you built. Now watch the algorithm do it — and compare its choices against yours.',
        },
        {
          kind: 'widget',
          widgetId: 'subset-construction-reveal',
          alt: 'Step-by-step animation of the subset construction, showing each set of NFA states collapsing into a single DFA state, with playback controls.',
        },
      ],
    },
  ],
};
