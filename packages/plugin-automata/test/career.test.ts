import { describe, expect, it } from 'vitest';
import {
  eligiblePromotionTarget,
  evaluateBlueprintUnlocks,
  evaluateCertifications,
  labTierForRank,
  rankById,
  validateCareerLadder,
  type EngineerCareerState,
} from '@arc/engine-progress';
import { MISSIONS } from '../src/curriculum/index.js';
import {
  BLUEPRINTS,
  CAREER_MILESTONES,
  CERTIFICATIONS,
  DEPARTMENTS,
  LAB_TIERS,
  RANK_LADDER,
} from '../src/career/index.js';

const MISSION_IDS = new Set(MISSIONS.map((m) => m.id));
const DISTRICT_IDS = new Set([
  'security-district',
  'quantum-research-lab',
  'research-archive',
  'regex-workshop',
  'grammar-tower',
  'stack-reactor',
  'pumping-dungeon',
]);

describe('career: rank ladder', () => {
  it('is structurally valid', () => {
    expect(validateCareerLadder(RANK_LADDER)).toEqual([]);
  });

  it('has exactly the 9 specified ranks in order', () => {
    expect(RANK_LADDER.ranks.map((r) => r.title)).toEqual([
      'Cadet Engineer',
      'Junior Engineer',
      'Automation Engineer',
      'Systems Engineer',
      'Research Engineer',
      'Senior Engineer',
      'Lead Engineer',
      'Chief Engineer',
      'Academy Architect',
    ]);
  });

  it('every requiredCertifications reference resolves to a real certification', () => {
    const certIds = new Set(CERTIFICATIONS.map((c) => c.id));
    for (const rank of RANK_LADDER.ranks) {
      for (const certId of rank.requiredCertifications ?? []) {
        expect(
          certIds.has(certId),
          `rank ${rank.id} references unknown certification ${certId}`,
        ).toBe(true);
      }
    }
  });

  it('every requiredBlueprints reference resolves to a real blueprint', () => {
    const bpIds = new Set(BLUEPRINTS.map((b) => b.id));
    for (const rank of RANK_LADDER.ranks) {
      for (const bpId of rank.requiredBlueprints ?? []) {
        expect(bpIds.has(bpId), `rank ${rank.id} references unknown blueprint ${bpId}`).toBe(true);
      }
    }
  });

  it('every requiredDepartmentReputation key resolves to a real department', () => {
    const deptIds = new Set(DEPARTMENTS.map((d) => d.id));
    for (const rank of RANK_LADDER.ranks) {
      for (const deptId of Object.keys(rank.requiredDepartmentReputation ?? {})) {
        expect(deptIds.has(deptId), `rank ${rank.id} references unknown department ${deptId}`).toBe(
          true,
        );
      }
    }
  });

  it('no rank requirement is circular: the blueprint gating Academy Architect does not itself require Academy Architect', () => {
    const architect = rankById(RANK_LADDER, 'academy-architect')!;
    const gatingBlueprintIds = architect.requiredBlueprints ?? [];
    for (const bpId of gatingBlueprintIds) {
      const bp = BLUEPRINTS.find((b) => b.id === bpId)!;
      expect(bp.unlockCondition.minRankOrder ?? -1).toBeLessThan(architect.order);
    }
  });

  it('a fully-maxed state (every cert, every reputation, boss victory, every blueprint) is eligible all the way to the top', () => {
    let state: EngineerCareerState = {
      rx: 999999,
      ec: 0,
      currentRankId: 'cadet-engineer',
      earnedCertifications: CERTIFICATIONS.map((c) => c.id),
      earnedBlueprints: BLUEPRINTS.map((b) => b.id),
      departmentReputation: Object.fromEntries(DEPARTMENTS.map((d) => [d.id, 1000])),
      bossVictories: ['toa.design.cfg-ambiguity-01'],
    };
    let guard = 0;
    while (guard < RANK_LADDER.ranks.length) {
      const target = eligiblePromotionTarget(RANK_LADDER, state);
      if (!target) break;
      state = { ...state, currentRankId: target.id };
      guard += 1;
    }
    expect(state.currentRankId).toBe('academy-architect');
  });
});

describe('career: certifications', () => {
  it('every required mission id exists in the curriculum mission database', () => {
    for (const cert of CERTIFICATIONS) {
      for (const missionId of cert.requiredMissionIds) {
        expect(
          MISSION_IDS.has(missionId),
          `certification ${cert.id} references unknown mission ${missionId}`,
        ).toBe(true);
      }
    }
  });

  it('every certification id is unique', () => {
    const ids = CERTIFICATIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('evaluateCertifications earns cert-dfa-engineer once its 3 missions are completed', () => {
    const def = CERTIFICATIONS.find((c) => c.id === 'cert-dfa-engineer')!;
    expect(evaluateCertifications([def], new Set(def.requiredMissionIds))).toEqual([
      'cert-dfa-engineer',
    ]);
    expect(evaluateCertifications([def], new Set([def.requiredMissionIds[0]!]))).toEqual([]);
  });
});

describe('career: blueprints', () => {
  it('every requiredCertifications reference in a blueprint resolves to a real certification', () => {
    const certIds = new Set(CERTIFICATIONS.map((c) => c.id));
    for (const bp of BLUEPRINTS) {
      for (const certId of bp.unlockCondition.requiredCertifications ?? []) {
        expect(
          certIds.has(certId),
          `blueprint ${bp.id} references unknown certification ${certId}`,
        ).toBe(true);
      }
    }
  });

  it('every requiredBlueprints chain reference resolves to a real blueprint and is not self-referential', () => {
    const bpIds = new Set(BLUEPRINTS.map((b) => b.id));
    for (const bp of BLUEPRINTS) {
      for (const reqId of bp.unlockCondition.requiredBlueprints ?? []) {
        expect(bpIds.has(reqId), `blueprint ${bp.id} references unknown blueprint ${reqId}`).toBe(
          true,
        );
        expect(reqId).not.toBe(bp.id);
      }
    }
  });

  it('evaluateBlueprintUnlocks resolves the full unlock chain in order', () => {
    const ctx = {
      rankOrder: 7,
      earnedCertifications: new Set(CERTIFICATIONS.map((c) => c.id)),
      departmentReputation: { 'quantum-research-lab': 100 },
      earnedBlueprints: new Set<string>(),
    };
    const firstPass = evaluateBlueprintUnlocks(BLUEPRINTS, ctx);
    expect(firstPass).toContain('bp-advanced-dfa-builder');
    expect(firstPass).not.toContain('bp-prototype-design-architect');

    const secondPass = evaluateBlueprintUnlocks(BLUEPRINTS, {
      ...ctx,
      earnedBlueprints: new Set(firstPass),
    });
    expect(secondPass).toContain('bp-prototype-design-architect');
  });
});

describe('career: departments', () => {
  it('every department id matches a real academy district', () => {
    for (const dept of DEPARTMENTS) {
      expect(
        DISTRICT_IDS.has(dept.id),
        `department ${dept.id} has no matching academy district`,
      ).toBe(true);
    }
  });

  it('every department has ascending, non-negative tier thresholds starting at 0', () => {
    for (const dept of DEPARTMENTS) {
      expect(dept.tiers[0]!.threshold).toBe(0);
      for (let i = 1; i < dept.tiers.length; i += 1) {
        expect(dept.tiers[i]!.threshold).toBeGreaterThan(dept.tiers[i - 1]!.threshold);
      }
    }
  });
});

describe('career: lab tiers', () => {
  it('defines exactly 5 tiers covering rank order 0 through the top rank', () => {
    expect(LAB_TIERS.length).toBe(5);
    const topOrder = RANK_LADDER.ranks[RANK_LADDER.ranks.length - 1]!.order;
    expect(labTierForRank(LAB_TIERS, 0).tier).toBe(1);
    expect(labTierForRank(LAB_TIERS, topOrder).tier).toBe(5);
  });
});

describe('career: milestones', () => {
  it('every triggerRankId resolves to a real rank', () => {
    const rankIds = new Set(RANK_LADDER.ranks.map((r) => r.id));
    for (const m of CAREER_MILESTONES) {
      expect(
        rankIds.has(m.triggerRankId),
        `milestone ${m.id} references unknown rank ${m.triggerRankId}`,
      ).toBe(true);
    }
  });

  it('every non-cadet rank has at least one milestone', () => {
    const triggered = new Set(CAREER_MILESTONES.map((m) => m.triggerRankId));
    for (const rank of RANK_LADDER.ranks.filter((r) => r.order > 0)) {
      expect(triggered.has(rank.id), `rank ${rank.id} has no career milestone`).toBe(true);
    }
  });
});
