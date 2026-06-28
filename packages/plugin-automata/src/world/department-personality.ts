import type { DepartmentPersonality } from '@arc/engine-world';

/**
 * Department personality (PROMPT 07) — one entry per existing district id from
 * apps/web/lib/campaign/academy.ts. This is purely ADDITIONAL atmosphere layered on top
 * of each district's existing accent color; it does not change district ids, missions,
 * or the existing campaign unlock graph.
 */
export const DEPARTMENT_PERSONALITIES: readonly DepartmentPersonality[] = [
  {
    districtId: 'security-district',
    mood: ['clean', 'precise', 'structured'],
    motif: 'scanning sentry drones',
    intensity: 'calm',
  },
  {
    districtId: 'quantum-research-lab',
    mood: ['unstable', 'energetic', 'volatile'],
    motif: 'floating containment particles',
    intensity: 'volatile',
  },
  {
    districtId: 'research-archive',
    mood: ['quiet', 'knowledge-focused'],
    motif: 'drifting research holograms',
    intensity: 'calm',
  },
  {
    districtId: 'regex-workshop',
    mood: ['precise', 'pattern-driven', 'energetic'],
    motif: 'pattern-matching light trails',
    intensity: 'active',
  },
  {
    districtId: 'grammar-tower',
    mood: ['ancient', 'elegant'],
    motif: 'floating golden books',
    intensity: 'calm',
  },
  {
    districtId: 'stack-reactor',
    mood: ['industrial', 'mechanical'],
    motif: 'hydraulic stack pistons',
    intensity: 'active',
  },
  {
    districtId: 'pumping-dungeon',
    mood: ['dark', 'dangerous'],
    motif: 'flickering warning lights',
    intensity: 'volatile',
  },
];
