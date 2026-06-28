import type { CertificationRequirement } from '@arc/engine-progress';

/**
 * Certification system (PROMPT 05) — distinct from career rank. Certifications gate
 * advanced missions and promotions by proving mastery of a specific area, regardless of
 * total RX earned. Requirements reference real mission ids from `../curriculum/missions.js`
 * (validated in career.test.ts) — including ids for missions still `status: 'designed'`,
 * which is honest: the certification simply cannot be earned until that mission ships.
 */
export const CERTIFICATIONS: readonly CertificationRequirement[] = [
  {
    id: 'cert-dfa-engineer',
    label: 'Certified DFA Engineer',
    requiredMissionIds: [
      'toa.dfa-ends-01',
      'toa.build.dfa-ends-01',
      'toa.design.dfa-minimization-01',
    ],
  },
  {
    id: 'cert-nfa-engineer',
    label: 'Certified NFA Engineer',
    requiredMissionIds: ['toa.nfa-branching', 'toa.nfa-to-dfa', 'toa.design.nfa-determinize-01'],
  },
  {
    id: 'cert-regex-specialist',
    label: 'Regex Specialist',
    requiredMissionIds: [
      'toa.design.regex-construction-01',
      'toa.design.regex-to-dfa-01',
      'toa.design.regex-precedence-mcq-01',
    ],
  },
  {
    id: 'cert-grammar-specialist',
    label: 'Grammar Specialist',
    requiredMissionIds: [
      'toa.design.grammar-derivation-01',
      'toa.design.regular-grammar-01',
      'toa.design.cfg-parse-tree-01',
    ],
  },
  {
    id: 'cert-pda-specialist',
    label: 'PDA Specialist',
    requiredMissionIds: ['toa.design.pda-construction-01'],
  },
  {
    id: 'cert-automata-master',
    label: 'Automata Master',
    requiredMissionIds: [
      'toa.dfa-ends-01',
      'toa.build.dfa-ends-01',
      'toa.nfa-branching',
      'toa.nfa-to-dfa',
      'toa.design.cfg-ambiguity-01',
      'toa.design.pumping-lemma-01',
    ],
  },
  {
    id: 'cert-compiler-researcher',
    label: 'Compiler Researcher',
    requiredMissionIds: [
      'toa.design.cfg-simplify-01',
      'toa.design.cfg-cnf-01',
      'toa.design.pda-construction-01',
    ],
  },
];
