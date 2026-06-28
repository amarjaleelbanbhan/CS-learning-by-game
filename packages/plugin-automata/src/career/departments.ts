import type { DepartmentDefinition } from '@arc/engine-progress';

/**
 * Academy Reputation departments (PROMPT 05) — one per district in
 * apps/web/lib/campaign/academy.ts, including the reserved "coming soon" districts so
 * reputation has somewhere to accrue once those labs ship.
 */
const STANDARD_TIERS = [
  { id: 'novice', label: 'Novice', threshold: 0 },
  { id: 'trusted', label: 'Trusted', threshold: 50 },
  { id: 'elite', label: 'Elite', threshold: 150 },
  { id: 'legendary', label: 'Legendary', threshold: 400 },
] as const;

export const DEPARTMENTS: readonly DepartmentDefinition[] = [
  { id: 'security-district', label: 'Security District', tiers: STANDARD_TIERS },
  { id: 'quantum-research-lab', label: 'Quantum Research Lab', tiers: STANDARD_TIERS },
  { id: 'research-archive', label: 'Research Archive', tiers: STANDARD_TIERS },
  { id: 'regex-workshop', label: 'Regex Workshop', tiers: STANDARD_TIERS },
  { id: 'grammar-tower', label: 'Grammar Tower', tiers: STANDARD_TIERS },
  { id: 'stack-reactor', label: 'Stack Reactor', tiers: STANDARD_TIERS },
  { id: 'pumping-dungeon', label: 'Pumping Research', tiers: STANDARD_TIERS },
];
