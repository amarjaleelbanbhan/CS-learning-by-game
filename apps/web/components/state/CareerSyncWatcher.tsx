'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from './gameStore';
import { districtForMission, isMissionBossVictory, useCareerStore } from './careerStore';
import { useHasMounted } from '@/components/hud/useHasMounted';

/**
 * Bridges gameStore (missions/xp/coins — unchanged since PROMPT 04) into careerStore
 * (rank/reputation/certifications/blueprints — PROMPT 05). Watches for newly-completed
 * missions to award department reputation and detect boss victories, then re-runs the
 * career engine's fixed-point sync. Mirrors LevelUpWatcher's diff-by-ref pattern.
 */
export function CareerSyncWatcher() {
  const mounted = useHasMounted();
  const xp = useGameStore((s) => s.xp);
  const coins = useGameStore((s) => s.coins);
  const completed = useGameStore((s) => s.completed);
  const recordReputation = useCareerStore((s) => s.recordReputation);
  const recordBossVictory = useCareerStore((s) => s.recordBossVictory);
  const sync = useCareerStore((s) => s.sync);
  const seenMissionIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!mounted) return;
    const completedIds = Object.keys(completed).filter((id) => completed[id]);

    for (const id of completedIds) {
      if (seenMissionIds.current.has(id)) continue;
      seenMissionIds.current.add(id);
      const district = districtForMission(id);
      if (district) recordReputation(district, 20);
      if (isMissionBossVictory(id)) recordBossVictory(id);
    }

    sync(xp, coins, completedIds);
  }, [mounted, xp, coins, completed, recordReputation, recordBossVictory, sync]);

  return null;
}
