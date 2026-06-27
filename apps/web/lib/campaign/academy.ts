import type { UnlockNode } from '@arc/engine-game';

export type MissionKind = 'tutorial' | 'mission' | 'spectacle';

export interface CampaignMission {
  /** Matches the MISSION_ID each mission component already reports to gameStore. */
  id: string;
  title: string;
  kind: MissionKind;
  href: string;
  xpReward: number;
  /** Other mission ids required before this one unlocks. */
  dependsOn: string[];
}

export type DistrictAccent = 'cyan' | 'violet' | 'gold';

export interface District {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  accent: DistrictAccent;
  missions: CampaignMission[];
}

/**
 * AUTOMATA ACADEMY — the campaign map. Every existing lab is a location in
 * one of these districts; every mission unlocks the next via the same
 * generic unlock-graph engine-game uses for anything (missions, districts,
 * future skill trees). Districts with no missions yet are real locations on
 * the map, just not built out — visible "coming soon," not hidden.
 */
export const DISTRICTS: readonly District[] = [
  {
    id: 'security-district',
    name: 'Security District',
    tagline: 'Deterministic Finite Automata',
    icon: '🛡️',
    accent: 'cyan',
    missions: [
      {
        id: 'toa.dfa-ends-01',
        title: 'Calibration',
        kind: 'tutorial',
        href: '/learn/dfa-ends-01',
        xpReward: 150,
        dependsOn: [],
      },
      {
        id: 'toa.build.dfa-ends-01',
        title: 'Perimeter Security',
        kind: 'mission',
        href: '/learn/build-dfa-security',
        xpReward: 220,
        dependsOn: ['toa.dfa-ends-01'],
      },
    ],
  },
  {
    id: 'quantum-research-lab',
    name: 'Quantum Research Lab',
    tagline: 'Nondeterministic Finite Automata',
    icon: '🌌',
    accent: 'violet',
    missions: [
      {
        id: 'toa.nfa-branching',
        title: 'Many Paths at Once',
        kind: 'mission',
        href: '/learn/nfa-branching',
        xpReward: 180,
        dependsOn: ['toa.build.dfa-ends-01'],
      },
    ],
  },
  {
    id: 'research-archive',
    name: 'Research Archive',
    tagline: 'Subset Construction — earned, not taught',
    icon: '🌀',
    accent: 'gold',
    missions: [
      {
        id: 'toa.nfa-to-dfa',
        title: 'NFA → DFA',
        kind: 'spectacle',
        href: '/learn/nfa-to-dfa',
        xpReward: 250,
        dependsOn: ['toa.nfa-branching'],
      },
    ],
  },
  {
    id: 'regex-workshop',
    name: 'Regex Workshop',
    tagline: 'Pattern Construction',
    icon: '⚡',
    accent: 'cyan',
    missions: [],
  },
  {
    id: 'grammar-tower',
    name: 'Grammar Tower',
    tagline: 'Context-Free Grammars',
    icon: '🗼',
    accent: 'violet',
    missions: [],
  },
  {
    id: 'stack-reactor',
    name: 'Stack Reactor',
    tagline: 'Pushdown Automata',
    icon: '⚙️',
    accent: 'gold',
    missions: [],
  },
  {
    id: 'pumping-dungeon',
    name: 'Pumping Dungeon',
    tagline: 'Proofs of Non-Regularity',
    icon: '⚗️',
    accent: 'cyan',
    missions: [],
  },
];

export function allMissions(): CampaignMission[] {
  return DISTRICTS.flatMap((d) => d.missions);
}

export function toUnlockNodes(): UnlockNode[] {
  return allMissions().map((m) => ({ id: m.id, dependsOn: m.dependsOn }));
}

/** A district is open once its entry mission is unlocked; "coming soon"
 * districts (no missions yet) are always shown locked. */
export function districtEntryMissionId(district: District): string | null {
  return district.missions[0]?.id ?? null;
}
