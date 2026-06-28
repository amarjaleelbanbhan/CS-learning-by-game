import type { LabTierDefinition } from '@arc/engine-progress';

/**
 * Laboratory Evolution (PROMPT 05) — 5 visual/thematic tiers keyed to rank order.
 * Actual 3D/holographic asset implementation is out of scope for this pass (no asset
 * pipeline exists yet); these definitions drive the Engineer Console's lab description
 * and a flat visual treatment (glow intensity, particle density) reusing existing FX.
 */
export const LAB_TIERS: readonly LabTierDefinition[] = [
  {
    tier: 1,
    title: "Engineer's Workstation",
    description: 'A single terminal and a desk-sized Arc Reactor core, dim but stable.',
    minRankOrder: 0,
  },
  {
    tier: 2,
    title: 'Personal Laboratory',
    description: 'A dedicated bench, one wall-mounted display, and a brighter reactor core.',
    minRankOrder: 1,
  },
  {
    tier: 3,
    title: 'Research Wing',
    description: 'Multiple displays and the first holographic schematic projector online.',
    minRankOrder: 3,
  },
  {
    tier: 4,
    title: 'Command Laboratory',
    description: 'A full-scale Arc Reactor model with live holograms tracking active research.',
    minRankOrder: 5,
  },
  {
    tier: 5,
    title: 'Academy Architect Laboratory',
    description:
      'A massive Arc Reactor, living holograms, and a command table overlooking the Academy.',
    minRankOrder: 8,
  },
];
