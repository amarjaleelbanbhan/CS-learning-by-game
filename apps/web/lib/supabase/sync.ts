'use client';

import { createClient } from './client';

/**
 * Cloud progress sync (FR-AUTH-3). Offline-first: localStorage stays the source of truth
 * for gameplay, and the cloud is a mirror that makes an account worth having (same
 * progress on another device). Every function here is a no-op when signed out or when no
 * Supabase project is configured, so guest mode never touches the network.
 *
 * SCOPE — deliberately just three fields: xp, coins, and the set of completed mission
 * ids. Everything else the game shows is DERIVED from those:
 *   - certifications, blueprints and rank are recomputed from scratch by
 *     `careerStore.sync(rx, ec, completedMissionIds)` on every load;
 *   - department reputation is re-awarded per completed mission by CareerSyncWatcher.
 * So syncing the inputs restores the whole career without mirroring any of it.
 *
 * NOT synced: per-attempt analytics (hint usage, timings) and ARIA's mentor memory.
 * Those stay device-local; see docs/ROADMAP.md.
 */

export interface CloudProgress {
  xp: number;
  coins: number;
  completedMissionIds: string[];
}

/** Current user's id, or null when signed out / unconfigured. */
export async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Reads cloud progress. Returns null when signed out, unconfigured, or on error. */
export async function pullProgress(): Promise<CloudProgress | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  // Result shapes are stated explicitly via maybeSingle<T>() / returns<T>(). The generated
  // `Database` types don't drive `.select()` inference under supabase-js 2.108 (the schema
  // resolves to `never`), and they're also stale — they predate migrations 0004-0006. These
  // are postgrest-js's own escape hatches, so the result types below are still checked;
  // only the column strings are unchecked. See docs/ROADMAP.md.
  const [profile, missions] = await Promise.all([
    supabase
      .from('profiles')
      .select('xp, coins')
      .eq('id', userId)
      .maybeSingle<{ xp: number; coins: number }>(),
    supabase
      .from('mission_progress')
      .select('mission_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .returns<{ mission_id: string }[]>(),
  ]);

  if (profile.error || missions.error) return null;

  return {
    xp: profile.data?.xp ?? 0,
    coins: profile.data?.coins ?? 0,
    completedMissionIds: (missions.data ?? []).map((m) => m.mission_id),
  };
}

/**
 * Merges local and cloud progress and writes the result back.
 *
 * Merge policy is max-of-scalars, union-of-sets. Progression in this game is monotonic —
 * you can only ever gain XP and complete missions, never lose them — so taking the
 * maximum is both correct and conflict-free, with no timestamps or vector clocks needed.
 * It also gives FR-AUTH-3's guest migration for free: a fresh cloud row is all zeros, so
 * the union is exactly the local guest progress.
 *
 * Returns the merged result so the caller can apply it locally, or null if it couldn't sync.
 */
export async function mergeProgress(local: CloudProgress): Promise<CloudProgress | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const cloud = (await pullProgress()) ?? { xp: 0, coins: 0, completedMissionIds: [] };

  const merged: CloudProgress = {
    xp: Math.max(local.xp, cloud.xp),
    coins: Math.max(local.coins, cloud.coins),
    completedMissionIds: [...new Set([...local.completedMissionIds, ...cloud.completedMissionIds])],
  };

  // Write payloads are declared as typed locals so they stay fully checked; only the
  // handoff to the client is cast, for the same `never`-schema reason as the reads above.
  const profilePatch: { xp: number; coins: number } = { xp: merged.xp, coins: merged.coins };

  // profiles has no INSERT policy by design — the row is created by the
  // on_auth_user_created trigger, so this is an update, never an upsert.
  const profileWrite = supabase
    .from('profiles')
    .update(profilePatch as never)
    .eq('id', userId);

  const newForCloud = merged.completedMissionIds.filter(
    (id) => !cloud.completedMissionIds.includes(id),
  );
  const missionRows: Array<{
    user_id: string;
    mission_id: string;
    status: 'completed';
    completed_at: string;
  }> = newForCloud.map((mission_id) => ({
    user_id: userId,
    mission_id,
    status: 'completed',
    completed_at: new Date().toISOString(),
  }));

  const missionWrite = missionRows.length
    ? supabase
        .from('mission_progress')
        .upsert(missionRows as never, { onConflict: 'user_id,mission_id' })
    : Promise.resolve({ error: null });

  const [p, m] = await Promise.all([profileWrite, missionWrite]);
  if (p.error || m.error) return null;

  return merged;
}
