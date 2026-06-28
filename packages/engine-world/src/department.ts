/**
 * Department personality — every district has its own identity that shapes dialogue,
 * atmosphere, and presentation. This module only carries the data shape; the actual
 * personalities are subject content (plugin-automata).
 */
export type AmbientIntensity = 'calm' | 'active' | 'volatile';

export interface DepartmentPersonality {
  readonly districtId: string;
  /** Mood keywords, e.g. ['clean', 'precise', 'structured']. */
  readonly mood: readonly string[];
  /** Short descriptive motif, e.g. 'scanning drones', 'floating ancient books'. */
  readonly motif: string;
  /** Hints how dense/energetic ambient effects for this department should be. */
  readonly intensity: AmbientIntensity;
}

export function personalityFor(
  defs: readonly DepartmentPersonality[],
  districtId: string,
): DepartmentPersonality | undefined {
  return defs.find((d) => d.districtId === districtId);
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/** Pure function of the clock — the academy's day cycle. Local time, no network needed. */
export function timeOfDay(now: number = Date.now()): TimeOfDay {
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
