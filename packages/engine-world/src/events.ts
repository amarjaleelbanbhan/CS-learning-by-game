/**
 * World events — academy-wide happenings that rotate over time, tied to a district, and
 * can unlock missions or affect rewards. Rotation is DETERMINISTIC and time-bucketed (not
 * random): every player sees the same event in the same time window, and it's trivially
 * testable since `activeWorldEvent` is a pure function of `now`.
 */
export interface WorldEventDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly districtId: string;
  /** Reward multiplier applied while the event is active (1 = no change). */
  readonly rewardMultiplier: number;
  /** Relative rotation frequency — higher weight means the event comes up more often. */
  readonly weight: number;
}

export const DEFAULT_ROTATION_BUCKET_MS = 7 * 24 * 60 * 60 * 1000; // one academy "week"

function flattenByWeight(
  defs: readonly WorldEventDefinition[],
): readonly WorldEventDefinition[] {
  const out: WorldEventDefinition[] = [];
  for (const def of defs) {
    const count = Math.max(1, Math.round(def.weight));
    for (let i = 0; i < count; i += 1) out.push(def);
  }
  return out;
}

/**
 * The event active at time `now`, deterministically rotated by time bucket. Returns null
 * when there are no event definitions to rotate through.
 */
export function activeWorldEvent(
  defs: readonly WorldEventDefinition[],
  now: number,
  bucketMs: number = DEFAULT_ROTATION_BUCKET_MS,
): WorldEventDefinition | null {
  if (defs.length === 0) return null;
  const flattened = flattenByWeight(defs);
  const bucket = Math.floor(now / bucketMs);
  return flattened[((bucket % flattened.length) + flattened.length) % flattened.length] ?? null;
}

/** Epoch ms when the rotation will next change, for UI countdowns. */
export function nextRotationAt(now: number, bucketMs: number = DEFAULT_ROTATION_BUCKET_MS): number {
  return (Math.floor(now / bucketMs) + 1) * bucketMs;
}

export function eventsForDistrict(
  defs: readonly WorldEventDefinition[],
  districtId: string,
): readonly WorldEventDefinition[] {
  return defs.filter((d) => d.districtId === districtId);
}
