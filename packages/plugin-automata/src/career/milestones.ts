import type { CareerMilestone } from '@arc/engine-progress';

/**
 * Career Milestones (PROMPT 05) — fired on promotion (see RANK_LADDER for the same
 * `triggerRankId`s). `unlocks` mirrors each rank's `unlocks` field; kept as a separate,
 * explicit list (rather than only deriving from the ladder) so the promotion ceremony can
 * announce milestones by title without re-deriving prose from raw unlock-flag strings.
 */
export const CAREER_MILESTONES: readonly CareerMilestone[] = [
  {
    id: 'milestone-junior-engineer',
    title: 'Personal Laboratory Granted',
    triggerRankId: 'junior-engineer',
    unlocks: ['lab-tier-2'],
  },
  {
    id: 'milestone-automation-engineer',
    title: 'Daily Contracts Unlocked',
    triggerRankId: 'automation-engineer',
    unlocks: ['daily-contracts'],
  },
  {
    id: 'milestone-systems-engineer',
    title: 'Research Wing & Regex Workshop Opened',
    triggerRankId: 'systems-engineer',
    unlocks: ['lab-tier-3', 'regex-workshop'],
  },
  {
    id: 'milestone-research-engineer',
    title: 'Grammar Tower Opened',
    triggerRankId: 'research-engineer',
    unlocks: ['grammar-tower'],
  },
  {
    id: 'milestone-senior-engineer',
    title: 'Command Laboratory & Weekly Operations Unlocked',
    triggerRankId: 'senior-engineer',
    unlocks: ['lab-tier-4', 'weekly-operations'],
  },
  {
    id: 'milestone-lead-engineer',
    title: 'Stack Reactor Opened',
    triggerRankId: 'lead-engineer',
    unlocks: ['stack-reactor'],
  },
  {
    id: 'milestone-chief-engineer',
    title: 'Pumping Research Opened',
    triggerRankId: 'chief-engineer',
    unlocks: ['pumping-dungeon'],
  },
  {
    id: 'milestone-academy-architect',
    title: 'Academy Architect Laboratory Commissioned',
    triggerRankId: 'academy-architect',
    unlocks: ['lab-tier-5', 'academy-architect-title'],
  },
];
