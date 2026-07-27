'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from './gameStore';
import { useHasMounted } from '@/components/hud/useHasMounted';
import { createClient } from '@/lib/supabase/client';
import { mergeProgress } from '@/lib/supabase/sync';

/** `completed` is a Record<id, boolean>; only truthy entries count as done. */
function completedIds(completed: Record<string, boolean>): string[] {
  return Object.keys(completed).filter((id) => completed[id]);
}

/**
 * Keeps local progress and the cloud in sync (FR-AUTH-3).
 *
 * Runs a merge on sign-in and whenever local progress changes while signed in. The merge
 * is monotonic (max XP/coins, union of completed missions), so it doubles as guest
 * migration: signing in for the first time pushes local progress up rather than
 * discarding it, and never clobbers progress made on another device.
 *
 * Gameplay never waits on this — localStorage remains the source of truth and every
 * failure path is a silent no-op, so being offline or signed out changes nothing.
 */
export function CloudSyncWatcher() {
  const mounted = useHasMounted();
  const xp = useGameStore((s) => s.xp);
  const coins = useGameStore((s) => s.coins);
  const completed = useGameStore((s) => s.completed);
  const syncing = useRef(false);

  useEffect(() => {
    if (!mounted) return;
    const supabase = createClient();
    if (!supabase) return;

    async function sync() {
      // Zustand's own state is read fresh here rather than closed over, so a merge that
      // starts during a burst of mission completions still writes the latest totals.
      if (syncing.current) return;
      syncing.current = true;
      try {
        const s = useGameStore.getState();
        const merged = await mergeProgress({
          xp: s.xp,
          coins: s.coins,
          completedMissionIds: completedIds(s.completed),
        });
        if (!merged) return;

        // Apply anything the cloud had that we didn't (progress from another device).
        const local = useGameStore.getState();
        const localIds = new Set(completedIds(local.completed));
        const gained = merged.completedMissionIds.filter((id) => !localIds.has(id));
        if (merged.xp > local.xp || merged.coins > local.coins || gained.length > 0) {
          useGameStore.setState({
            xp: Math.max(local.xp, merged.xp),
            coins: Math.max(local.coins, merged.coins),
            completed: {
              ...local.completed,
              ...Object.fromEntries(gained.map((id) => [id, true])),
            },
          });
        }
      } finally {
        syncing.current = false;
      }
    }

    void sync();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') void sync();
    });
    return () => sub.subscription.unsubscribe();
  }, [mounted, xp, coins, completed]);

  return null;
}
