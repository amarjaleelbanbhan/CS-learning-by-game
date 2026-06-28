import type { CareerLadder } from '@arc/engine-progress';

/**
 * Engineer Career rank ladder for Theory of Automata (PROMPT 05).
 *
 * Every rank above Cadet gates on more than raw RX — certifications, department
 * reputation, or a boss-mission victory — so promotions always require demonstrated
 * mastery, never just "played long enough." `unlocks` is descriptive metadata consumed
 * by the UI (Engineer Console, promotion ceremony); it does not itself gate district
 * access in the campaign unlock-graph (apps/web/lib/campaign/academy.ts) — that remains
 * driven by mission prerequisites. Wiring rank-gated district access is a flagged future
 * integration point, not done in this pass.
 */
export const RANK_LADDER: CareerLadder = {
  ranks: [
    {
      id: 'cadet-engineer',
      title: 'Cadet Engineer',
      order: 0,
      rxThreshold: 0,
      unlocks: ['lab-tier-1'],
    },
    {
      id: 'junior-engineer',
      title: 'Junior Engineer',
      order: 1,
      rxThreshold: 500,
      unlocks: ['lab-tier-2'],
    },
    {
      id: 'automation-engineer',
      title: 'Automation Engineer',
      order: 2,
      rxThreshold: 1500,
      requiredCertifications: ['cert-dfa-engineer'],
      unlocks: ['daily-contracts'],
    },
    {
      id: 'systems-engineer',
      title: 'Systems Engineer',
      order: 3,
      rxThreshold: 3500,
      requiredCertifications: ['cert-nfa-engineer'],
      requiredDepartmentReputation: { 'security-district': 50 },
      unlocks: ['lab-tier-3', 'regex-workshop'],
    },
    {
      id: 'research-engineer',
      title: 'Research Engineer',
      order: 4,
      rxThreshold: 7000,
      requiredCertifications: ['cert-regex-specialist'],
      requiredDepartmentReputation: { 'quantum-research-lab': 50 },
      unlocks: ['grammar-tower'],
    },
    {
      id: 'senior-engineer',
      title: 'Senior Engineer',
      order: 5,
      rxThreshold: 12000,
      requiredCertifications: ['cert-grammar-specialist'],
      unlocks: ['lab-tier-4', 'weekly-operations'],
    },
    {
      id: 'lead-engineer',
      title: 'Lead Engineer',
      order: 6,
      rxThreshold: 20000,
      requiresBossVictory: true,
      unlocks: ['stack-reactor'],
    },
    {
      id: 'chief-engineer',
      title: 'Chief Engineer',
      order: 7,
      rxThreshold: 32000,
      requiredCertifications: ['cert-pda-specialist', 'cert-automata-master'],
      unlocks: ['pumping-dungeon'],
    },
    {
      id: 'academy-architect',
      title: 'Academy Architect',
      order: 8,
      rxThreshold: 50000,
      requiredCertifications: ['cert-compiler-researcher'],
      requiredBlueprints: ['bp-prototype-design-architect'],
      unlocks: ['lab-tier-5', 'academy-architect-title'],
    },
  ],
};
