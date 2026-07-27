import { describe, expect, it } from 'vitest';
import { DEFAULT_ROTATION_BUCKET_MS, activeWorldEvent } from '@arc/engine-world';
import { MISSIONS, WORLD_EVENTS } from '@arc/plugin-automata';
import { boostedRewards, eventRewardMultiplier } from './rewards';

/**
 * Rotation is deterministic, so rather than hard-coding a magic timestamp we search
 * forward for a bucket where a given event is active. That keeps these tests correct even
 * if the event list or its weights change.
 */
function timeWhenActive(eventId: string): number {
  for (let bucket = 0; bucket < 500; bucket += 1) {
    const now = bucket * DEFAULT_ROTATION_BUCKET_MS;
    if (activeWorldEvent(WORLD_EVENTS, now)?.id === eventId) return now;
  }
  throw new Error(`no bucket found where ${eventId} is active`);
}

/** A live mission belonging to the given district. */
function missionInDistrict(districtId: string): string {
  const m = MISSIONS.find((x) => x.status === 'live' && x.district === districtId);
  if (!m) throw new Error(`no live mission in ${districtId}`);
  return m.id;
}

describe('eventRewardMultiplier', () => {
  it('boosts a mission in the district the active event belongs to', () => {
    const event = WORLD_EVENTS.find((e) => e.districtId === 'security-district')!;
    const now = timeWhenActive(event.id);
    const missionId = missionInDistrict('security-district');
    expect(eventRewardMultiplier(missionId, now)).toBe(event.rewardMultiplier);
  });

  it('does NOT boost a mission in a different district', () => {
    const event = WORLD_EVENTS.find((e) => e.districtId === 'security-district')!;
    const now = timeWhenActive(event.id);
    const missionId = missionInDistrict('quantum-research-lab');
    expect(eventRewardMultiplier(missionId, now)).toBe(1);
  });

  it('returns 1 for an unknown mission id rather than throwing', () => {
    expect(eventRewardMultiplier('does.not.exist', timeWhenActive(WORLD_EVENTS[0]!.id))).toBe(1);
  });

  it('is deterministic — the same mission and timestamp always agree', () => {
    const now = timeWhenActive(WORLD_EVENTS[0]!.id);
    const id = missionInDistrict(WORLD_EVENTS[0]!.districtId);
    expect(eventRewardMultiplier(id, now)).toBe(eventRewardMultiplier(id, now));
  });
});

describe('boostedRewards', () => {
  it('scales xp and coins by the multiplier, rounded to integers', () => {
    const event = WORLD_EVENTS.find((e) => e.districtId === 'security-district')!;
    const now = timeWhenActive(event.id);
    const missionId = missionInDistrict('security-district');

    const [xp, coins] = boostedRewards(missionId, 200, 60, now);
    expect(xp).toBe(Math.round(200 * event.rewardMultiplier));
    expect(coins).toBe(Math.round(60 * event.rewardMultiplier));
    expect(Number.isInteger(xp) && Number.isInteger(coins)).toBe(true);
  });

  it('passes rewards through untouched when no event targets the district', () => {
    const event = WORLD_EVENTS.find((e) => e.districtId === 'security-district')!;
    const now = timeWhenActive(event.id);
    expect(boostedRewards(missionInDistrict('quantum-research-lab'), 200, 60, now)).toEqual([
      200, 60,
    ]);
  });

  it('never reduces a reward — every event multiplier is a bonus', () => {
    for (const event of WORLD_EVENTS) {
      const now = timeWhenActive(event.id);
      const live = MISSIONS.filter((m) => m.status === 'live');
      for (const m of live) {
        const [xp, coins] = boostedRewards(m.id, 100, 100, now);
        expect(xp, `${m.id} during ${event.id}`).toBeGreaterThanOrEqual(100);
        expect(coins, `${m.id} during ${event.id}`).toBeGreaterThanOrEqual(100);
      }
    }
  });
});
