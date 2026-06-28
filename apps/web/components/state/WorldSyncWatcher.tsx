'use client';

import { useEffect, useRef } from 'react';
import { generateWorldReaction } from '@arc/engine-world';
import { CERTIFICATIONS, missionById } from '@arc/plugin-automata';
import { useHasMounted } from '@/components/hud/useHasMounted';
import { useCareerStore } from './careerStore';
import { useWorldStore } from './worldStore';
import { currentWorldEvent, unlockedDecorationIds } from '@/lib/world/world';
import { useCompanionStore } from '@/components/companion/companionStore';
import { ariaMentionWorldEvent } from '@/lib/companion/mentorActions';

/**
 * Bridges careerStore + the clock into worldStore: unlocks lab decorations as career
 * progress allows, announces world reactions (certification earned, boss defeated) once
 * each via the companion, and has ARIA mention a new world event the first time it
 * rotates in. Mirrors CareerSyncWatcher's diff-by-ref pattern from PROMPT 05.
 */
export function WorldSyncWatcher() {
  const mounted = useHasMounted();
  const earnedCertifications = useCareerStore((s) => s.earnedCertifications);
  const bossVictories = useCareerStore((s) => s.bossVictories);
  const unlockDecorations = useWorldStore((s) => s.unlockDecorations);
  const markWorldEventMentioned = useWorldStore((s) => s.markWorldEventMentioned);
  const say = useCompanionStore((s) => s.say);

  const seenCerts = useRef<Set<string> | null>(null);
  const seenBosses = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!mounted) return;

    unlockDecorations(unlockedDecorationIds());

    // First run after mount primes the seen-sets from persisted state without announcing
    // — only genuinely NEW certifications/boss victories earned during this session (or
    // after this watcher is already live) get a world reaction.
    if (seenCerts.current === null) {
      seenCerts.current = new Set(earnedCertifications);
    } else {
      for (const certId of earnedCertifications) {
        if (seenCerts.current.has(certId)) continue;
        seenCerts.current.add(certId);
        const cert = CERTIFICATIONS.find((c) => c.id === certId);
        if (!cert) continue;
        say(
          'certification-earned',
          generateWorldReaction({ kind: 'certification', label: cert.label }).announcement,
        );
      }
    }

    if (seenBosses.current === null) {
      seenBosses.current = new Set(bossVictories);
    } else {
      for (const missionId of bossVictories) {
        if (seenBosses.current.has(missionId)) continue;
        seenBosses.current.add(missionId);
        const mission = missionById(missionId);
        if (!mission) continue;
        say(
          'boss-victory',
          generateWorldReaction({ kind: 'boss-victory', label: mission.title }).announcement,
        );
      }
    }

    const event = currentWorldEvent();
    if (event && markWorldEventMentioned(event.id)) {
      ariaMentionWorldEvent(event);
    }
  }, [
    mounted,
    earnedCertifications,
    bossVictories,
    unlockDecorations,
    markWorldEventMentioned,
    say,
  ]);

  return null;
}
