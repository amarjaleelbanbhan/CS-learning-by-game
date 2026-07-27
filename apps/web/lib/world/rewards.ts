import { activeWorldEvent } from '@arc/engine-world';
import { MISSIONS, WORLD_EVENTS } from '@arc/plugin-automata';

/**
 * World-event reward boosts.
 *
 * `WorldEventBanner` advertises a multiplier ("×1.50 rewards") for the active academy
 * event, but nothing was applying it — the player was shown a bonus they never received.
 * This closes that gap.
 *
 * A boost applies only to missions in the event's OWN district: a Security Incident pays
 * extra for Security District work, not for everything on campus. Rotation is
 * deterministic and time-bucketed (see engine-world/events), so every player gets the
 * same boost in the same window — no per-player randomness to exploit or explain.
 *
 * Kept pure and store-free so it is unit-testable and so gameStore stays subject-agnostic
 * (it must not know what a "district" or an "academy event" is).
 */

/** The active reward multiplier for a mission — 1 when no event targets its district. */
export function eventRewardMultiplier(missionId: string, now: number = Date.now()): number {
  const event = activeWorldEvent(WORLD_EVENTS, now);
  if (!event) return 1;
  const district = MISSIONS.find((m) => m.id === missionId)?.district;
  return district && district === event.districtId ? event.rewardMultiplier : 1;
}

/**
 * Rewards after any active event boost, as a tuple so call sites stay a one-line change:
 * `completeMission(ID, ...boostedRewards(ID, xp, coins))`.
 *
 * Rounded to whole numbers — XP and EC are integers everywhere else in the game, and a
 * fractional balance would surface as ugly decimals in the HUD.
 */
export function boostedRewards(
  missionId: string,
  xp: number,
  coins: number,
  now: number = Date.now(),
): [xp: number, coins: number] {
  const multiplier = eventRewardMultiplier(missionId, now);
  return [Math.round(xp * multiplier), Math.round(coins * multiplier)];
}
