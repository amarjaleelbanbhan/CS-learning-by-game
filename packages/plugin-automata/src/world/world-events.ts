import type { WorldEventDefinition } from '@arc/engine-world';

/**
 * Academy world events (PROMPT 07) — one per district, so every part of the campus has
 * something that can be happening. Rotation (which event is active when) is handled
 * deterministically by engine-world's `activeWorldEvent`; this module only supplies content.
 */
export const WORLD_EVENTS: readonly WorldEventDefinition[] = [
  {
    id: 'research-festival',
    title: 'Research Festival',
    description: 'The Research Archive hosts its seasonal showcase of subset-construction work.',
    districtId: 'research-archive',
    rewardMultiplier: 1.25,
    weight: 1,
  },
  {
    id: 'security-incident',
    title: 'Security Incident',
    description: 'An access-code anomaly has the Security District on alert.',
    districtId: 'security-district',
    rewardMultiplier: 1.5,
    weight: 1,
  },
  {
    id: 'compiler-crisis',
    title: 'Compiler Crisis',
    description: 'A misbehaving stack discipline has the Reactor running hot.',
    districtId: 'stack-reactor',
    rewardMultiplier: 1.5,
    weight: 1,
  },
  {
    id: 'quantum-reactor-failure',
    title: 'Quantum Reactor Failure',
    description: 'Containment is unstable — every branch in the lab needs verifying.',
    districtId: 'quantum-research-lab',
    rewardMultiplier: 1.4,
    weight: 1,
  },
  {
    id: 'grammar-competition',
    title: 'Grammar Competition',
    description: 'Engineers across the Tower compete to derive the cleanest grammars.',
    districtId: 'grammar-tower',
    rewardMultiplier: 1.3,
    weight: 1,
  },
  {
    id: 'department-tournament',
    title: 'Department Tournament',
    description: 'Every department sends its best — hosted this season in the Dungeon arena.',
    districtId: 'pumping-dungeon',
    rewardMultiplier: 1.2,
    weight: 1,
  },
  {
    id: 'weekend-challenge',
    title: 'Weekend Challenge',
    description: 'A timed pattern-construction sprint, open to all ranks.',
    districtId: 'regex-workshop',
    rewardMultiplier: 1.15,
    weight: 1,
  },
];

export function worldEventById(id: string): WorldEventDefinition | undefined {
  return WORLD_EVENTS.find((e) => e.id === id);
}
