import type { BlueprintDefinition } from '@arc/engine-progress';

/**
 * Blueprint collectibles (PROMPT 05). `tool` blueprints are framed as in-fiction
 * unlocks for future labs (Regex/Grammar/PDA — explicitly NOT built this pass, see
 * docs/career-system-report.md); `cosmetic` blueprints unlock visual themes/badges now;
 * `lore` blueprints are pure collectibles. No unlock condition here is circular with the
 * rank ladder: `bp-prototype-design-architect` requires Chief Engineer (order 7), one rank
 * below the Academy Architect promotion that itself requires this blueprint.
 */
export const BLUEPRINTS: readonly BlueprintDefinition[] = [
  {
    id: 'bp-advanced-dfa-builder',
    title: 'Advanced DFA Builder',
    category: 'tool',
    unlockCondition: { requiredCertifications: ['cert-dfa-engineer'] },
  },
  {
    id: 'bp-quantum-analyzer',
    title: 'Quantum Analyzer',
    category: 'tool',
    unlockCondition: {
      requiredCertifications: ['cert-nfa-engineer'],
      requiredDepartmentReputation: { 'quantum-research-lab': 40 },
    },
  },
  {
    id: 'bp-regex-scanner',
    title: 'Regex Scanner',
    category: 'tool',
    unlockCondition: { requiredCertifications: ['cert-regex-specialist'] },
  },
  {
    id: 'bp-grammar-compiler',
    title: 'Grammar Compiler',
    category: 'tool',
    unlockCondition: { requiredCertifications: ['cert-grammar-specialist'] },
  },
  {
    id: 'bp-stack-simulator',
    title: 'Stack Simulator',
    category: 'tool',
    unlockCondition: { requiredCertifications: ['cert-pda-specialist'] },
  },
  {
    id: 'bp-engineer-badge-bronze',
    title: 'Engineer Badge — Bronze',
    category: 'cosmetic',
    unlockCondition: { minRankOrder: 1 },
  },
  {
    id: 'bp-engineer-badge-silver',
    title: 'Engineer Badge — Silver',
    category: 'cosmetic',
    unlockCondition: { minRankOrder: 4 },
  },
  {
    id: 'bp-engineer-badge-gold',
    title: 'Engineer Badge — Gold',
    category: 'cosmetic',
    unlockCondition: { minRankOrder: 7 },
  },
  {
    id: 'bp-visualization-theme-aurora',
    title: 'Visualization Theme: Aurora',
    category: 'cosmetic',
    unlockCondition: { minRankOrder: 3 },
  },
  {
    id: 'bp-visualization-theme-nebula',
    title: 'Visualization Theme: Nebula',
    category: 'cosmetic',
    unlockCondition: { minRankOrder: 5 },
  },
  {
    id: 'bp-academy-lore-fragment-1',
    title: 'Academy Lore Fragment I',
    category: 'lore',
    unlockCondition: { requiredCertifications: ['cert-automata-master'] },
  },
  {
    id: 'bp-prototype-design-architect',
    title: "Architect's Prototype Design",
    category: 'tool',
    unlockCondition: {
      minRankOrder: 7,
      requiredBlueprints: [
        'bp-advanced-dfa-builder',
        'bp-quantum-analyzer',
        'bp-regex-scanner',
        'bp-grammar-compiler',
        'bp-stack-simulator',
      ],
    },
  },
];
