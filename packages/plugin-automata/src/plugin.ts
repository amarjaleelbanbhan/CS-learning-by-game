import { createRng, labId, missionId, moduleId, pluginId, topicId } from '@arc/shared';
import type { GeneratedProblem, ProblemGenerator, SubjectPlugin } from '@arc/plugin-sdk';

// Mission ids (kebab, namespaced by subject).
const M_LANGUAGES = missionId('toa.languages');
const M_DFA = missionId('toa.dfa');

/**
 * Deterministic generator for an entry-level "classify the string" DFA problem.
 * Real generators (Phase 8) will emit reference automata + language specs; this
 * proves the contract end-to-end during Phase 2.
 */
const dfaClassifyGenerator: ProblemGenerator = ({ difficulty, seed }): GeneratedProblem => {
  const rng = createRng(`dfa:${difficulty}:${seed}`);
  const length = 2 + difficulty;
  const sample = Array.from({ length }, () => rng.pick(['0', '1'])).join('');
  return {
    topicId: topicId('dfa'),
    difficulty,
    seed,
    prompt: `Does the string "${sample}" end in "01"? Accept or reject.`,
    payload: { sample, language: 'ends-with-01' },
  };
};

/** Version 1 subject plugin — currently a thin slice; expands across Phase 9. */
export const automataPlugin: SubjectPlugin = {
  id: pluginId('automata'),
  title: 'Theory of Automata',
  description: 'The first ARC Reactor subject: from languages to the pumping lemma.',
  version: '0.0.0',
  modules: [
    {
      id: moduleId('foundations'),
      title: 'Foundations',
      order: 1,
      missions: [
        {
          id: M_LANGUAGES,
          title: 'Languages',
          order: 1,
          topicId: topicId('languages'),
          xpReward: 100,
          unlockRequires: [],
          loadContent: async () => ({ stages: [] }),
        },
        {
          id: M_DFA,
          title: 'Deterministic Finite Automata',
          order: 2,
          topicId: topicId('dfa'),
          xpReward: 150,
          unlockRequires: [M_LANGUAGES],
          loadContent: async () => ({ stages: [] }),
        },
      ],
    },
  ],
  labs: [
    {
      id: labId('dfa-lab'),
      title: 'DFA Lab',
      // Real React component arrives in Phase 5/9; loader keeps the SDK framework-agnostic.
      load: async () => ({ default: {} }),
    },
  ],
  problemGenerators: [
    {
      topicId: topicId('dfa'),
      title: 'Classify strings (ends with 01)',
      generate: dfaClassifyGenerator,
    },
  ],
  skillTree: {
    nodes: [
      { missionId: M_LANGUAGES, dependsOn: [] },
      { missionId: M_DFA, dependsOn: [M_LANGUAGES] },
    ],
  },
  theme: { accent: '#38E1FF', accentSecondary: '#2D7BFF', success: '#36F2A6', danger: '#FF5C7A' },
};
