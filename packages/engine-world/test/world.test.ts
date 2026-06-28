import { describe, expect, it } from 'vitest';
import {
  EMPTY_NPC_MEMORY,
  RELATIONSHIP_TIERS,
  recordConversation,
  relationshipTierFor,
  type NpcMemory,
} from '../src/npc.js';
import { eligibleLines, selectDialogueLine, type DialogueLine } from '../src/dialogue.js';
import {
  DEFAULT_ROTATION_BUCKET_MS,
  activeWorldEvent,
  eventsForDistrict,
  nextRotationAt,
  type WorldEventDefinition,
} from '../src/events.js';
import { personalityFor, timeOfDay, type DepartmentPersonality } from '../src/department.js';
import { generateWorldReaction } from '../src/reactions.js';
import { evaluateWorldUnlocks, worldConditionMet, type WorldUnlockable } from '../src/unlocks.js';

// ---------------------------------------------------------------------------
// Relationship tiers
// ---------------------------------------------------------------------------
describe('relationship tiers', () => {
  it('starts at first-meeting for a fresh relationship', () => {
    expect(relationshipTierFor(0).id).toBe('first-meeting');
  });

  it('advances through tiers as score crosses thresholds', () => {
    expect(relationshipTierFor(10).id).toBe('acquaintance');
    expect(relationshipTierFor(29).id).toBe('acquaintance');
    expect(relationshipTierFor(30).id).toBe('frequent-visitor');
    expect(relationshipTierFor(75).id).toBe('trusted-engineer');
    expect(relationshipTierFor(150).id).toBe('department-hero');
    expect(relationshipTierFor(99999).id).toBe('department-hero');
  });

  it('records a conversation, setting firstMetAt only once', () => {
    let m: NpcMemory = EMPTY_NPC_MEMORY;
    m = recordConversation(m, 1000, 'line-a');
    expect(m.firstMetAt).toBe(1000);
    expect(m.conversationCount).toBe(1);
    expect(m.lastLineId).toBe('line-a');

    m = recordConversation(m, 5000, 'line-b');
    expect(m.firstMetAt).toBe(1000); // unchanged
    expect(m.lastInteractionAt).toBe(5000);
    expect(m.conversationCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Dynamic dialogue selection
// ---------------------------------------------------------------------------
const TURING_LINES: readonly DialogueLine[] = [
  { id: 'welcome', text: 'Welcome to the Academy.' },
  { id: 'chief-respect', text: "We've been waiting for your expertise.", minRankOrder: 6 },
  { id: 'hero-respect', text: 'The whole department speaks of you.', minRelationshipScore: 75 },
  { id: 'festival', text: 'The Research Festival is underway!', worldEventId: 'research-festival' },
];

describe('dynamic dialogue selection', () => {
  it('shows the generic welcome line for a fresh cadet', () => {
    const line = selectDialogueLine(TURING_LINES, {
      rankOrder: 0,
      relationshipScore: 0,
      activeWorldEventId: null,
      memory: EMPTY_NPC_MEMORY,
      seed: 0,
    });
    expect(line?.id).toBe('welcome');
  });

  it('prefers the most specific eligible line once rank is high enough', () => {
    const line = selectDialogueLine(TURING_LINES, {
      rankOrder: 6,
      relationshipScore: 0,
      activeWorldEventId: null,
      memory: EMPTY_NPC_MEMORY,
      seed: 0,
    });
    expect(line?.id).toBe('chief-respect');
  });

  it('never repeats identical dialogue when an alternative at the same tier exists', () => {
    const lines: readonly DialogueLine[] = [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ];
    const memory: NpcMemory = { ...EMPTY_NPC_MEMORY, lastLineId: 'a' };
    const line = selectDialogueLine(lines, {
      rankOrder: 0,
      relationshipScore: 0,
      activeWorldEventId: null,
      memory,
      seed: 0,
    });
    expect(line?.id).toBe('b');
  });

  it('falls back to the repeated line when it is the only eligible option', () => {
    const lines: readonly DialogueLine[] = [{ id: 'only', text: 'Only line.' }];
    const memory: NpcMemory = { ...EMPTY_NPC_MEMORY, lastLineId: 'only' };
    const line = selectDialogueLine(lines, {
      rankOrder: 0,
      relationshipScore: 0,
      activeWorldEventId: null,
      memory,
      seed: 0,
    });
    expect(line?.id).toBe('only');
  });

  it('surfaces a world-event line only while that event is active', () => {
    const inactive = selectDialogueLine(TURING_LINES, {
      rankOrder: 0,
      relationshipScore: 0,
      activeWorldEventId: null,
      memory: EMPTY_NPC_MEMORY,
      seed: 0,
    });
    expect(inactive?.id).not.toBe('festival');

    const active = selectDialogueLine(TURING_LINES, {
      rankOrder: 0,
      relationshipScore: 0,
      activeWorldEventId: 'research-festival',
      memory: EMPTY_NPC_MEMORY,
      seed: 0,
    });
    expect(active?.id).toBe('festival');
  });

  it('returns null when nothing is eligible', () => {
    const gated: readonly DialogueLine[] = [{ id: 'locked', text: 'X', minRankOrder: 99 }];
    expect(
      selectDialogueLine(gated, {
        rankOrder: 0,
        relationshipScore: 0,
        activeWorldEventId: null,
        memory: EMPTY_NPC_MEMORY,
        seed: 0,
      }),
    ).toBeNull();
    expect(
      eligibleLines(gated, {
        rankOrder: 0,
        relationshipScore: 0,
        activeWorldEventId: null,
        memory: EMPTY_NPC_MEMORY,
        seed: 0,
      }),
    ).toHaveLength(0);
  });

  it('is a deterministic pure function: same inputs produce the same output', () => {
    const ctx = {
      rankOrder: 3,
      relationshipScore: 20,
      activeWorldEventId: null,
      memory: EMPTY_NPC_MEMORY,
      seed: 7,
    };
    const a = selectDialogueLine(TURING_LINES, ctx);
    const b = selectDialogueLine(TURING_LINES, ctx);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// World event rotation
// ---------------------------------------------------------------------------
const EVENTS: readonly WorldEventDefinition[] = [
  {
    id: 'research-festival',
    title: 'Research Festival',
    description: 'd',
    districtId: 'research-archive',
    rewardMultiplier: 1.25,
    weight: 1,
  },
  {
    id: 'security-incident',
    title: 'Security Incident',
    description: 'd',
    districtId: 'security-district',
    rewardMultiplier: 1.5,
    weight: 1,
  },
];

describe('world event rotation', () => {
  it('is deterministic: the same timestamp always yields the same event', () => {
    const now = 1_700_000_000_000;
    expect(activeWorldEvent(EVENTS, now)?.id).toBe(activeWorldEvent(EVENTS, now)?.id);
  });

  it('returns null when there are no event definitions', () => {
    expect(activeWorldEvent([], Date.now())).toBeNull();
  });

  it('rotates to a different event in a different time bucket', () => {
    const bucketMs = DEFAULT_ROTATION_BUCKET_MS;
    const first = activeWorldEvent(EVENTS, 0, bucketMs);
    const second = activeWorldEvent(EVENTS, bucketMs, bucketMs);
    // With two equally-weighted events rotating by bucket index, adjacent buckets differ.
    expect(first?.id).not.toBe(second?.id);
  });

  it('weights rotation frequency: a higher-weight event appears in more buckets', () => {
    const weighted: readonly WorldEventDefinition[] = [
      { ...EVENTS[0]!, weight: 3 },
      { ...EVENTS[1]!, weight: 1 },
    ];
    const bucketMs = 1000;
    let festivalCount = 0;
    for (let bucket = 0; bucket < 8; bucket += 1) {
      if (activeWorldEvent(weighted, bucket * bucketMs, bucketMs)?.id === 'research-festival') {
        festivalCount += 1;
      }
    }
    expect(festivalCount).toBeGreaterThan(4); // 3/4 of 8 buckets, roughly
  });

  it('computes the next rotation boundary after now', () => {
    const bucketMs = 1000;
    expect(nextRotationAt(1500, bucketMs)).toBe(2000);
    expect(nextRotationAt(0, bucketMs)).toBe(1000);
  });

  it('filters events by district', () => {
    expect(eventsForDistrict(EVENTS, 'security-district').map((e) => e.id)).toEqual([
      'security-incident',
    ]);
  });
});

// ---------------------------------------------------------------------------
// Department personality + time of day
// ---------------------------------------------------------------------------
const PERSONALITIES: readonly DepartmentPersonality[] = [
  {
    districtId: 'security-district',
    mood: ['clean', 'precise'],
    motif: 'scanning drones',
    intensity: 'calm',
  },
];

describe('department personality', () => {
  it('looks up a personality by district id', () => {
    expect(personalityFor(PERSONALITIES, 'security-district')?.motif).toBe('scanning drones');
  });

  it('returns undefined for an unknown district', () => {
    expect(personalityFor(PERSONALITIES, 'nonexistent')).toBeUndefined();
  });
});

describe('time of day', () => {
  it('buckets hours into morning/afternoon/evening/night', () => {
    const at = (hour: number) => new Date(2026, 0, 1, hour).getTime();
    expect(timeOfDay(at(7))).toBe('morning');
    expect(timeOfDay(at(13))).toBe('afternoon');
    expect(timeOfDay(at(19))).toBe('evening');
    expect(timeOfDay(at(2))).toBe('night');
    expect(timeOfDay(at(23))).toBe('night');
  });
});

// ---------------------------------------------------------------------------
// World reactions — grounded announcements
// ---------------------------------------------------------------------------
describe('world reactions', () => {
  it('names the real certification in a certification reaction', () => {
    const r = generateWorldReaction({ kind: 'certification', label: 'Certified DFA Engineer' });
    expect(r.announcement).toContain('Certified DFA Engineer');
  });

  it('names the real rank in a promotion reaction', () => {
    const r = generateWorldReaction({ kind: 'promotion', label: 'Systems Engineer' });
    expect(r.announcement).toContain('Systems Engineer');
  });

  it('carries the related department id through unchanged', () => {
    const r = generateWorldReaction({
      kind: 'district-unlock',
      label: 'Quantum Research Lab',
      districtId: 'quantum-research-lab',
    });
    expect(r.relatedDepartmentId).toBe('quantum-research-lab');
  });
});

// ---------------------------------------------------------------------------
// World unlock conditions
// ---------------------------------------------------------------------------
const UNLOCKABLES: readonly WorldUnlockable[] = [
  { id: 'always', unlockCondition: {} },
  { id: 'rank-gated', unlockCondition: { minRankOrder: 3 } },
  { id: 'cert-gated', unlockCondition: { requiredCertifications: ['cert-dfa-engineer'] } },
  {
    id: 'rep-gated',
    unlockCondition: { requiredDepartmentReputation: { 'security-district': 50 } },
  },
  { id: 'boss-gated', unlockCondition: { requiredBossVictories: ['toa.design.cfg-cnf-01'] } },
];

describe('world unlock conditions', () => {
  const baseCtx = {
    rankOrder: 0,
    earnedCertifications: new Set<string>(),
    departmentReputation: {},
    bossVictories: new Set<string>(),
  };

  it('an empty condition is always met', () => {
    expect(worldConditionMet({}, baseCtx)).toBe(true);
  });

  it('evaluates exactly the unlockables whose conditions are met', () => {
    expect(evaluateWorldUnlocks(UNLOCKABLES, baseCtx)).toEqual(['always']);

    const advanced = {
      rankOrder: 5,
      earnedCertifications: new Set(['cert-dfa-engineer']),
      departmentReputation: { 'security-district': 60 },
      bossVictories: new Set(['toa.design.cfg-cnf-01']),
    };
    expect(new Set(evaluateWorldUnlocks(UNLOCKABLES, advanced))).toEqual(
      new Set(['always', 'rank-gated', 'cert-gated', 'rep-gated', 'boss-gated']),
    );
  });

  it('gates on rank order strictly', () => {
    expect(worldConditionMet({ minRankOrder: 3 }, { ...baseCtx, rankOrder: 2 })).toBe(false);
    expect(worldConditionMet({ minRankOrder: 3 }, { ...baseCtx, rankOrder: 3 })).toBe(true);
  });
});
