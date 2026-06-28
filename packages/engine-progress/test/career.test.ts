import { describe, expect, it } from 'vitest';
import {
  addReputation,
  createInitialCareerState,
  eligiblePromotionTarget,
  evaluateBlueprintUnlocks,
  evaluateCertifications,
  isEligibleForPromotion,
  labTierForRank,
  milestonesForRank,
  nextRank,
  promote,
  promoteAll,
  rankById,
  rankProgress,
  reputationTier,
  unmetPromotionRequirements,
  validateCareerLadder,
  type BlueprintDefinition,
  type CareerLadder,
  type CareerMilestone,
  type CertificationRequirement,
  type DepartmentDefinition,
  type EngineerCareerState,
  type LabTierDefinition,
} from '../src/index.js';

const LADDER: CareerLadder = {
  ranks: [
    { id: 'cadet', title: 'Cadet Engineer', order: 0, rxThreshold: 0, unlocks: [] },
    { id: 'junior', title: 'Junior Engineer', order: 1, rxThreshold: 500, unlocks: ['lab-tier-2'] },
    {
      id: 'automation',
      title: 'Automation Engineer',
      order: 2,
      rxThreshold: 1200,
      requiredCertifications: ['cert-dfa'],
      unlocks: [],
    },
    {
      id: 'systems',
      title: 'Systems Engineer',
      order: 3,
      rxThreshold: 2200,
      requiredDepartmentReputation: { 'security-district': 50 },
      unlocks: [],
    },
    {
      id: 'lead',
      title: 'Lead Engineer',
      order: 4,
      rxThreshold: 4000,
      requiresBossVictory: true,
      unlocks: [],
    },
  ],
};

describe('validateCareerLadder', () => {
  it('accepts a well-formed ladder', () => {
    expect(validateCareerLadder(LADDER)).toEqual([]);
  });

  it('flags duplicate ids', () => {
    const bad: CareerLadder = { ranks: [...LADDER.ranks, { ...LADDER.ranks[0]! }] };
    expect(validateCareerLadder(bad).length).toBeGreaterThan(0);
  });

  it('flags a non-contiguous order sequence', () => {
    const bad: CareerLadder = {
      ranks: [
        { id: 'a', title: 'A', order: 0, rxThreshold: 0, unlocks: [] },
        { id: 'b', title: 'B', order: 2, rxThreshold: 100, unlocks: [] },
      ],
    };
    expect(validateCareerLadder(bad).length).toBeGreaterThan(0);
  });

  it('flags a non-monotonic rxThreshold', () => {
    const bad: CareerLadder = {
      ranks: [
        { id: 'a', title: 'A', order: 0, rxThreshold: 100, unlocks: [] },
        { id: 'b', title: 'B', order: 1, rxThreshold: 50, unlocks: [] },
      ],
    };
    expect(validateCareerLadder(bad).length).toBeGreaterThan(0);
  });
});

describe('promotion gating', () => {
  it('a fresh cadet is not yet eligible for junior (RX too low)', () => {
    const state = createInitialCareerState('cadet');
    expect(isEligibleForPromotion(LADDER, state)).toBe(false);
    expect(unmetPromotionRequirements(LADDER, state)).toEqual(
      expect.arrayContaining([expect.stringContaining('Research Experience')]),
    );
  });

  it('hitting the RX threshold alone makes a pure RX-gated rank eligible', () => {
    const state: EngineerCareerState = { ...createInitialCareerState('cadet'), rx: 500 };
    expect(isEligibleForPromotion(LADDER, state)).toBe(true);
    expect(eligiblePromotionTarget(LADDER, state)?.id).toBe('junior');
  });

  it('RX alone is not enough when a certification is also required', () => {
    const state: EngineerCareerState = { ...createInitialCareerState('junior'), rx: 1200 };
    expect(isEligibleForPromotion(LADDER, state)).toBe(false);
    expect(unmetPromotionRequirements(LADDER, state)).toEqual(
      expect.arrayContaining([expect.stringContaining('cert-dfa')]),
    );
  });

  it('promote() is a no-op when ineligible and returns the same reference', () => {
    const state = createInitialCareerState('cadet');
    expect(promote(LADDER, state)).toBe(state);
  });

  it('promote() advances exactly one rank when eligible', () => {
    const state: EngineerCareerState = { ...createInitialCareerState('cadet'), rx: 500 };
    const promoted = promote(LADDER, state);
    expect(promoted.currentRankId).toBe('junior');
    expect(promoted).not.toBe(state);
  });

  it('certification + RX together unlock automation engineer', () => {
    const state: EngineerCareerState = {
      ...createInitialCareerState('junior'),
      rx: 1200,
      earnedCertifications: ['cert-dfa'],
    };
    expect(eligiblePromotionTarget(LADDER, state)?.id).toBe('automation');
  });

  it('department reputation gates systems engineer', () => {
    let state: EngineerCareerState = {
      ...createInitialCareerState('automation'),
      rx: 2200,
    };
    expect(isEligibleForPromotion(LADDER, state)).toBe(false);
    state = addReputation(state, 'security-district', 60);
    expect(eligiblePromotionTarget(LADDER, state)?.id).toBe('systems');
  });

  it('boss victory gates lead engineer regardless of RX', () => {
    const state: EngineerCareerState = { ...createInitialCareerState('systems'), rx: 9999 };
    expect(isEligibleForPromotion(LADDER, state)).toBe(false);
    const withVictory: EngineerCareerState = { ...state, bossVictories: ['boss-cfg-ambiguity'] };
    expect(eligiblePromotionTarget(LADDER, withVictory)?.id).toBe('lead');
  });

  it('promoteAll jumps multiple ranks from a single large RX grant when no other gates apply', () => {
    const tinyLadder: CareerLadder = {
      ranks: [
        { id: 'a', title: 'A', order: 0, rxThreshold: 0, unlocks: [] },
        { id: 'b', title: 'B', order: 1, rxThreshold: 100, unlocks: [] },
        { id: 'c', title: 'C', order: 2, rxThreshold: 200, unlocks: [] },
      ],
    };
    const state: EngineerCareerState = { ...createInitialCareerState('a'), rx: 250 };
    expect(promoteAll(tinyLadder, state).currentRankId).toBe('c');
  });

  it('nextRank is undefined at the top of the ladder', () => {
    const state = createInitialCareerState('lead');
    expect(nextRank(LADDER, state)).toBeUndefined();
    expect(unmetPromotionRequirements(LADDER, state)).toEqual([]);
  });

  it('rankById throws on an unknown id surface is avoided — returns undefined instead', () => {
    expect(rankById(LADDER, 'ghost')).toBeUndefined();
  });
});

describe('rankProgress', () => {
  it('reports 0% right at the floor of a rank and 100% at the next threshold', () => {
    const atFloor = rankProgress(LADDER, { ...createInitialCareerState('junior'), rx: 500 });
    expect(atFloor.rxProgressPct).toBe(0);
    const atCeiling = rankProgress(LADDER, { ...createInitialCareerState('junior'), rx: 1200 });
    expect(atCeiling.rxProgressPct).toBe(100);
  });

  it('caps at 100 for the final rank with no next', () => {
    const top = rankProgress(LADDER, { ...createInitialCareerState('lead'), rx: 99999 });
    expect(top.next).toBeUndefined();
    expect(top.rxProgressPct).toBe(100);
  });
});

describe('department reputation', () => {
  const dept: DepartmentDefinition = {
    id: 'security-district',
    label: 'Security District',
    tiers: [
      { id: 'novice', label: 'Novice', threshold: 0 },
      { id: 'trusted', label: 'Trusted', threshold: 50 },
      { id: 'elite', label: 'Elite', threshold: 150 },
    ],
  };

  it('returns the highest tier met, never overshoots', () => {
    expect(reputationTier(dept, 0)?.id).toBe('novice');
    expect(reputationTier(dept, 49)?.id).toBe('novice');
    expect(reputationTier(dept, 50)?.id).toBe('trusted');
    expect(reputationTier(dept, 200)?.id).toBe('elite');
  });

  it('addReputation accumulates per department independently', () => {
    let state = createInitialCareerState('cadet');
    state = addReputation(state, 'security-district', 30);
    state = addReputation(state, 'quantum-research-lab', 10);
    state = addReputation(state, 'security-district', 25);
    expect(state.departmentReputation['security-district']).toBe(55);
    expect(state.departmentReputation['quantum-research-lab']).toBe(10);
  });
});

describe('certifications', () => {
  const defs: CertificationRequirement[] = [
    { id: 'cert-dfa', label: 'Certified DFA Engineer', requiredMissionIds: ['m1', 'm2'] },
    { id: 'cert-nfa', label: 'Certified NFA Engineer', requiredMissionIds: ['m3'] },
  ];

  it('a certification is earned only once every required mission is completed', () => {
    expect(evaluateCertifications(defs, new Set(['m1']))).toEqual([]);
    expect(evaluateCertifications(defs, new Set(['m1', 'm2']))).toEqual(['cert-dfa']);
    expect(evaluateCertifications(defs, new Set(['m1', 'm2', 'm3']))).toEqual([
      'cert-dfa',
      'cert-nfa',
    ]);
  });

  it('is pure — recomputes the full set, not a cumulative delta', () => {
    const a = evaluateCertifications(defs, new Set(['m1', 'm2']));
    const b = evaluateCertifications(defs, new Set(['m1', 'm2']));
    expect(a).toEqual(b);
  });
});

describe('blueprint unlocks', () => {
  const defs: BlueprintDefinition[] = [
    {
      id: 'bp-scanner',
      title: 'Regex Scanner',
      category: 'tool',
      unlockCondition: { requiredCertifications: ['cert-dfa'] },
    },
    {
      id: 'bp-quantum-analyzer',
      title: 'Quantum Analyzer',
      category: 'tool',
      unlockCondition: {
        minRankOrder: 2,
        requiredDepartmentReputation: { 'quantum-research-lab': 40 },
      },
    },
    {
      id: 'bp-master-theme',
      title: 'Master Theme',
      category: 'cosmetic',
      unlockCondition: { requiredBlueprints: ['bp-scanner', 'bp-quantum-analyzer'] },
    },
  ];

  it('unlocks gated purely by certification', () => {
    const unlocked = evaluateBlueprintUnlocks(defs, {
      rankOrder: 0,
      earnedCertifications: new Set(['cert-dfa']),
      departmentReputation: {},
      earnedBlueprints: new Set(),
    });
    expect(unlocked).toEqual(['bp-scanner']);
  });

  it('requires both rank order and department reputation together', () => {
    const partial = evaluateBlueprintUnlocks(defs, {
      rankOrder: 2,
      earnedCertifications: new Set(),
      departmentReputation: { 'quantum-research-lab': 10 },
      earnedBlueprints: new Set(),
    });
    expect(partial).toEqual([]);

    const full = evaluateBlueprintUnlocks(defs, {
      rankOrder: 2,
      earnedCertifications: new Set(),
      departmentReputation: { 'quantum-research-lab': 40 },
      earnedBlueprints: new Set(),
    });
    expect(full).toEqual(['bp-quantum-analyzer']);
  });

  it('a chained unlock needs every prerequisite blueprint already earned', () => {
    const unlocked = evaluateBlueprintUnlocks(defs, {
      rankOrder: 2,
      earnedCertifications: new Set(['cert-dfa']),
      departmentReputation: { 'quantum-research-lab': 40 },
      earnedBlueprints: new Set(['bp-scanner', 'bp-quantum-analyzer']),
    });
    expect(unlocked).toContain('bp-master-theme');
  });
});

describe('laboratory tiers', () => {
  const tiers: LabTierDefinition[] = [
    { tier: 1, title: 'Workstation', description: 'A desk and a terminal.', minRankOrder: 0 },
    { tier: 2, title: 'Small Lab', description: 'One Arc Reactor model.', minRankOrder: 1 },
    { tier: 5, title: 'Academy Architect Lab', description: 'Command table.', minRankOrder: 8 },
  ];

  it('returns the highest tier met without overshooting', () => {
    expect(labTierForRank(tiers, 0).tier).toBe(1);
    expect(labTierForRank(tiers, 1).tier).toBe(2);
    expect(labTierForRank(tiers, 4).tier).toBe(2);
    expect(labTierForRank(tiers, 8).tier).toBe(5);
  });

  it('throws if no tier 1 (minRankOrder 0) is defined — a content-authoring bug', () => {
    const broken: LabTierDefinition[] = [
      { tier: 2, title: 'X', description: 'x', minRankOrder: 1 },
    ];
    expect(() => labTierForRank(broken, 0)).toThrow();
  });
});

describe('career milestones', () => {
  const milestones: CareerMilestone[] = [
    {
      id: 'm-junior',
      title: 'Lab access expanded',
      triggerRankId: 'junior',
      unlocks: ['lab-tier-2'],
    },
    {
      id: 'm-junior-2',
      title: 'New department',
      triggerRankId: 'junior',
      unlocks: ['quantum-research-lab'],
    },
    { id: 'm-lead', title: 'Command table', triggerRankId: 'lead', unlocks: ['lab-tier-5'] },
  ];

  it('filters milestones by their trigger rank', () => {
    expect(milestonesForRank(milestones, 'junior').map((m) => m.id)).toEqual([
      'm-junior',
      'm-junior-2',
    ]);
    expect(milestonesForRank(milestones, 'cadet')).toEqual([]);
  });
});
