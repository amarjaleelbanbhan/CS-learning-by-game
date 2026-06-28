import type { NpcDefinition } from '@arc/engine-world';

/**
 * Automata Academy NPC roster (PROMPT 07). Presence gating is rank-order-based so the
 * academy visibly populates as the player progresses — each threshold lines up with the
 * rank ladder's own `unlocks` metadata (see career/rank-ladder.ts) so an NPC tends to
 * appear around the same time their district becomes relevant. Two NPCs (Laboratory
 * Assistant, Maintenance Drone) live in the player's own lab and are always present.
 */
export const NPCS: readonly NpcDefinition[] = [
  {
    id: 'security-chief',
    name: 'Security Chief Reyes',
    role: 'Security District Chief',
    locationId: 'security-district',
    departmentId: 'security-district',
    unlockCondition: {},
  },
  {
    id: 'lab-assistant',
    name: 'ORBIT',
    role: 'Laboratory Assistant',
    locationId: 'lab',
    departmentId: null,
    unlockCondition: {},
  },
  {
    id: 'maintenance-drone',
    name: 'Unit 7',
    role: 'Maintenance Drone',
    locationId: 'lab',
    departmentId: null,
    unlockCondition: {},
  },
  {
    id: 'professor-kleene',
    name: 'Professor Kleene',
    role: 'Quantum Theory Chair',
    locationId: 'quantum-research-lab',
    departmentId: 'quantum-research-lab',
    unlockCondition: { minRankOrder: 1 },
  },
  {
    id: 'quantum-scientist',
    name: 'Dr. Voss',
    role: 'Quantum Research Scientist',
    locationId: 'quantum-research-lab',
    departmentId: 'quantum-research-lab',
    unlockCondition: { requiredDepartmentReputation: { 'quantum-research-lab': 10 } },
  },
  {
    id: 'professor-turing',
    name: 'Professor Turing',
    role: 'Department Chair Emeritus',
    locationId: 'research-archive',
    departmentId: 'research-archive',
    unlockCondition: { minRankOrder: 2 },
  },
  {
    id: 'grammar-archivist',
    name: 'The Archivist',
    role: 'Grammar Tower Archivist',
    locationId: 'grammar-tower',
    departmentId: 'grammar-tower',
    unlockCondition: { minRankOrder: 4 },
  },
  {
    id: 'compiler-engineer',
    name: 'Chief Engineer Osei',
    role: 'Stack Reactor Compiler Engineer',
    locationId: 'stack-reactor',
    departmentId: 'stack-reactor',
    unlockCondition: { minRankOrder: 6 },
  },
];

export function npcById(id: string): NpcDefinition | undefined {
  return NPCS.find((n) => n.id === id);
}

export function npcsForDistrict(districtId: string): readonly NpcDefinition[] {
  return NPCS.filter((n) => n.locationId === districtId);
}
