import type { WorldUnlockable } from '@arc/engine-world';

/**
 * Laboratory decorations (PROMPT 07) — makes the existing 5-tier lab evolution
 * (career/lab-tiers.ts) visibly itemized instead of just descriptive prose. Each
 * decoration unlocks independently via the same WorldUnlockCondition shape used for
 * NPCs, so equipment, certifications, and displays can each gate on whatever is most
 * narratively appropriate (mostly rank order, matching the lab tier it belongs to; one
 * is certification-gated to reward a specific milestone).
 */
export interface LabDecoration extends WorldUnlockable {
  readonly title: string;
  readonly labTier: number;
}

export const LAB_DECORATIONS: readonly LabDecoration[] = [
  { id: 'terminal-basic', title: 'Primary Terminal', labTier: 1, unlockCondition: {} },
  { id: 'reactor-core-dim', title: 'Desk Reactor Core', labTier: 1, unlockCondition: {} },
  {
    id: 'wall-display',
    title: 'Wall-Mounted Display',
    labTier: 2,
    unlockCondition: { minRankOrder: 1 },
  },
  {
    id: 'assistant-drone-dock',
    title: 'Assistant Drone Dock',
    labTier: 2,
    unlockCondition: { minRankOrder: 1 },
  },
  {
    id: 'hologram-projector',
    title: 'Holographic Schematic Projector',
    labTier: 3,
    unlockCondition: { minRankOrder: 3 },
  },
  {
    id: 'cert-trophy-case',
    title: 'Certification Trophy Case',
    labTier: 3,
    unlockCondition: { requiredCertifications: ['cert-dfa-engineer'] },
  },
  {
    id: 'command-holo-table',
    title: 'Command Holo-Table',
    labTier: 4,
    unlockCondition: { minRankOrder: 5 },
  },
  {
    id: 'architect-banner',
    title: 'Academy Architect Banner',
    labTier: 5,
    unlockCondition: { minRankOrder: 8 },
  },
];
