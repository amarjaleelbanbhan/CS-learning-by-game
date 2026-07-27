import type { Question } from '@arc/engine-assessment';
import { stateId, type StateId } from '@arc/shared';
import type { DFA } from '@arc/engine-automata';
import type { Layout } from '@/components/viz/graph-model';

export interface DfaView {
  dfa: DFA;
  layout: Layout;
}

export function redundantDfaView(): DfaView {
  const alphabet = ['0', '1'];
  const states = ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map(stateId);
  const start = stateId('q0');
  const accepting = new Set(['q4', 'q5', 'q6'].map(stateId));

  const delta = new Map<StateId, Map<string, StateId>>();
  delta.set(
    stateId('q0'),
    new Map([
      ['0', stateId('q4')],
      ['1', stateId('q1')],
    ]),
  );
  delta.set(
    stateId('q1'),
    new Map([
      ['0', stateId('q5')],
      ['1', stateId('q2')],
    ]),
  );
  delta.set(
    stateId('q2'),
    new Map([
      ['0', stateId('q6')],
      ['1', stateId('q3')],
    ]),
  );
  delta.set(
    stateId('q3'),
    new Map([
      ['0', stateId('q4')],
      ['1', stateId('q1')],
    ]),
  );
  delta.set(
    stateId('q4'),
    new Map([
      ['0', stateId('q5')],
      ['1', stateId('q1')],
    ]),
  );
  delta.set(
    stateId('q5'),
    new Map([
      ['0', stateId('q6')],
      ['1', stateId('q2')],
    ]),
  );
  delta.set(
    stateId('q6'),
    new Map([
      ['0', stateId('q4')],
      ['1', stateId('q3')],
    ]),
  );

  const layout: Layout = {
    q0: { x: 60, y: 200 },
    q1: { x: 180, y: 80 },
    q2: { x: 300, y: 80 },
    q3: { x: 420, y: 80 },
    q4: { x: 180, y: 320 },
    q5: { x: 300, y: 320 },
    q6: { x: 420, y: 320 },
  };

  return {
    dfa: { alphabet, states, start, accepting, delta },
    layout,
  };
}

export interface DfaMinimizationPayload {
  alphabet: readonly string[];
}

export const dfaMinimizationQuestion: Question<DfaMinimizationPayload> = {
  id: 'toa.design.dfa-minimization-01',
  type: 'dfa-minimize',
  topic: 'dfa',
  concept: 'dfa-minimization',
  difficulty: 3,
  prompt:
    'The core security buffer has redundant nodes, consuming excess processing power. Study the active 7-state circuit, determine which states are equivalent (indistinguishable), and construct the minimal equivalent DFA.',
  hints: [
    {
      kind: 'tiny-hint',
      text: 'Start by separating accepting states from non-accepting states — they can never merge with each other.',
    },
    {
      kind: 'question',
      text: 'Two states are equivalent only if every transition from them leads to equivalent states. Check q1, q2, and q3 — do they all go to the same blocks on 0 and 1?',
    },
    {
      kind: 'highlight-state',
      text: 'Look at the accepting states q4, q5, and q6. On symbol "0", where do they transition? Do they behave identically under all inputs?',
    },
    {
      kind: 'highlight-transition',
      text: 'Trace the transitions for q0. Can it be merged with q1, or does it serve a unique role as the starting state?',
    },
    {
      kind: 'animate-idea',
      text: 'Recall that a DFA is minimal when no two states can be merged. The final minimized DFA for this language only needs 2 states.',
    },
    {
      kind: 'visualization',
      text: 'The minimal DFA accepts strings ending in 0. The start state tracks "ends in 1 or start", and the other state tracks "ends in 0".',
    },
  ],
  xpReward: 240,
  coinsReward: 80,
  achievementId: 'minimalist-engineer',
  estimatedTimeSec: 600,
  commonMistakes: [
    'Merging states that are distinguishable (i.e. one leads to an accept state on some input while the other leads to a reject state).',
    'Creating more states than necessary (the target minimal machine has exactly 2 states).',
    'Forgetting to mark the state representing q4/q5/q6 as accepting.',
  ],
  payload: { alphabet: ['0', '1'] },
};
