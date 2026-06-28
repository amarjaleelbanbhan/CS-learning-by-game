import { describe, expect, it } from 'vitest';
import {
  eligibleLines,
  selectDialogueLine,
  type DialogueSelectionContext,
} from '@arc/engine-world';
import { RANK_LADDER } from '../src/career/index.js';
import {
  DEPARTMENT_PERSONALITIES,
  DIALOGUE_BANKS,
  NPCS,
  WORLD_EVENTS,
  dialogueFor,
  npcById,
  npcsForDistrict,
  worldEventById,
} from '../src/world/index.js';

const DISTRICT_IDS = new Set([
  'security-district',
  'quantum-research-lab',
  'research-archive',
  'regex-workshop',
  'grammar-tower',
  'stack-reactor',
  'pumping-dungeon',
]);
const TOP_RANK_ORDER = RANK_LADDER.ranks[RANK_LADDER.ranks.length - 1]!.order;

const baseCtx = (overrides: Partial<DialogueSelectionContext> = {}): DialogueSelectionContext => ({
  rankOrder: 0,
  relationshipScore: 0,
  activeWorldEventId: null,
  memory: { firstMetAt: null, lastInteractionAt: null, conversationCount: 0, lastLineId: null },
  seed: 0,
  ...overrides,
});

describe('world: NPC roster', () => {
  it('has exactly the 8 specified NPCs', () => {
    expect(NPCS.map((n) => n.id).sort()).toEqual(
      [
        'security-chief',
        'lab-assistant',
        'maintenance-drone',
        'professor-kleene',
        'quantum-scientist',
        'professor-turing',
        'grammar-archivist',
        'compiler-engineer',
      ].sort(),
    );
  });

  it('every NPC bound to a district references a real, existing district id', () => {
    for (const npc of NPCS) {
      if (npc.departmentId !== null) {
        expect(DISTRICT_IDS.has(npc.departmentId), npc.id).toBe(true);
      }
    }
  });

  it('lab NPCs have no department and are always present', () => {
    const orbit = npcById('lab-assistant')!;
    expect(orbit.locationId).toBe('lab');
    expect(orbit.departmentId).toBeNull();
    expect(orbit.unlockCondition).toEqual({});
  });

  it('every NPC unlock condition is satisfiable by the top rank', () => {
    for (const npc of NPCS) {
      expect(npc.unlockCondition.minRankOrder ?? 0, npc.id).toBeLessThanOrEqual(TOP_RANK_ORDER);
    }
  });

  it('npcsForDistrict returns only NPCs located there', () => {
    const securityNpcs = npcsForDistrict('security-district');
    expect(securityNpcs.map((n) => n.id)).toEqual(['security-chief']);
  });

  it('npcById resolves a real NPC and returns undefined for an unknown id', () => {
    expect(npcById('security-chief')?.name).toBeDefined();
    expect(npcById('nonexistent')).toBeUndefined();
  });
});

describe('world: dialogue banks', () => {
  it('every NPC has at least one dialogue line', () => {
    for (const npc of NPCS) {
      expect(dialogueFor(npc.id).length, npc.id).toBeGreaterThan(0);
    }
  });

  it('there is no dialogue bank for an NPC id that does not exist', () => {
    const npcIds = new Set(NPCS.map((n) => n.id));
    for (const bankNpcId of Object.keys(DIALOGUE_BANKS)) {
      expect(npcIds.has(bankNpcId)).toBe(true);
    }
  });

  it('every world-event-gated line references a real world event', () => {
    const eventIds = new Set(WORLD_EVENTS.map((e) => e.id));
    for (const lines of Object.values(DIALOGUE_BANKS)) {
      for (const line of lines) {
        if (line.worldEventId) expect(eventIds.has(line.worldEventId), line.id).toBe(true);
      }
    }
  });

  it('every NPC has a baseline line eligible to a fresh cadet', () => {
    for (const npc of NPCS) {
      const lines = dialogueFor(npc.id);
      expect(eligibleLines(lines, baseCtx()).length, npc.id).toBeGreaterThan(0);
    }
  });

  it("the Security Chief's dialogue grows more specific as rank rises", () => {
    const lines = dialogueFor('security-chief');
    expect(selectDialogueLine(lines, baseCtx())?.id).toBe('sc-welcome');
    expect(selectDialogueLine(lines, baseCtx({ rankOrder: 6 }))?.id).toBe('sc-chief-respect');
  });

  it("a world event surfaces an NPC's event-aware line", () => {
    const lines = dialogueFor('security-chief');
    const line = selectDialogueLine(lines, baseCtx({ activeWorldEventId: 'security-incident' }));
    expect(line?.id).toBe('sc-incident');
  });
});

describe('world: events', () => {
  it('has exactly the 7 specified events', () => {
    expect(WORLD_EVENTS.map((e) => e.id).sort()).toEqual(
      [
        'research-festival',
        'security-incident',
        'compiler-crisis',
        'quantum-reactor-failure',
        'grammar-competition',
        'department-tournament',
        'weekend-challenge',
      ].sort(),
    );
  });

  it('every event references a real, existing district id', () => {
    for (const event of WORLD_EVENTS) {
      expect(DISTRICT_IDS.has(event.districtId), event.id).toBe(true);
    }
  });

  it('every district has at least one event', () => {
    for (const districtId of DISTRICT_IDS) {
      expect(WORLD_EVENTS.some((e) => e.districtId === districtId), districtId).toBe(true);
    }
  });

  it('worldEventById resolves correctly', () => {
    expect(worldEventById('research-festival')?.title).toBe('Research Festival');
    expect(worldEventById('nonexistent')).toBeUndefined();
  });

  it('every reward multiplier is greater than 1 (events are always a bonus, never a penalty)', () => {
    for (const event of WORLD_EVENTS) {
      expect(event.rewardMultiplier, event.id).toBeGreaterThan(1);
    }
  });
});

describe('world: department personality', () => {
  it('covers exactly the 7 existing districts, no more, no less', () => {
    expect(new Set(DEPARTMENT_PERSONALITIES.map((p) => p.districtId))).toEqual(DISTRICT_IDS);
  });

  it('every personality has at least one mood keyword and a motif', () => {
    for (const p of DEPARTMENT_PERSONALITIES) {
      expect(p.mood.length, p.districtId).toBeGreaterThan(0);
      expect(p.motif.length, p.districtId).toBeGreaterThan(0);
    }
  });
});
