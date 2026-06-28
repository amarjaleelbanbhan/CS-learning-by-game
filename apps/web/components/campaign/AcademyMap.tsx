'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { computeUnlocked } from '@arc/engine-game';
import type { NpcDefinition } from '@arc/engine-world';
import { useGameStore } from '@/components/state/gameStore';
import { useWorldStore } from '@/components/state/worldStore';
import { useHasMounted } from '@/components/hud/useHasMounted';
import { Panel } from '@/components/ui/Panel';
import { DepartmentBadge } from '@/components/world/DepartmentBadge';
import { WorldEventBanner } from '@/components/world/WorldEventBanner';
import { NpcChip } from '@/components/world/NpcChip';
import { NpcDialogueModal } from '@/components/world/NpcDialogueModal';
import { unlockedNpcsForDistrict } from '@/lib/world/world';
import {
  DISTRICTS,
  districtEntryMissionId,
  toUnlockNodes,
  type CampaignMission,
  type DistrictAccent,
} from '@/lib/campaign/academy';

const ACCENT_CLASSES: Record<DistrictAccent, { border: string; text: string; glow: string }> = {
  cyan: { border: 'border-arc-cyan/20', text: 'text-arc-cyan', glow: 'hover:shadow-glow-strong' },
  violet: { border: 'border-arc-violet/20', text: 'text-arc-violet', glow: '' },
  gold: { border: 'border-arc-gold/20', text: 'text-arc-gold', glow: '' },
};

const KIND_LABEL: Record<CampaignMission['kind'], string> = {
  tutorial: 'Tutorial',
  mission: 'Mission',
  spectacle: 'Earned Spectacle',
};

/**
 * AUTOMATA ACADEMY world map. Replaces a flat lab grid with locations the
 * player unlocks by completing missions, not by clicking a list — the same
 * unlock-graph engine (`computeUnlocked`) will eventually drive every future
 * district, skill tree, and boss gate in the campaign.
 */
export function AcademyMap() {
  const mounted = useHasMounted();
  const completed = useGameStore((s) => s.completed);
  const currentDistrictId = useWorldStore((s) => s.currentDistrictId);
  const setCurrentDistrict = useWorldStore((s) => s.setCurrentDistrict);
  const completedIds = new Set(mounted ? Object.keys(completed).filter((k) => completed[k]) : []);
  const unlocked = computeUnlocked(toUnlockNodes(), completedIds);
  const [activeNpc, setActiveNpc] = useState<NpcDefinition | null>(null);

  return (
    <div className="space-y-5">
      {mounted && <WorldEventBanner />}

      {DISTRICTS.map((district, i) => {
        const entryId = districtEntryMissionId(district);
        const districtUnlocked = entryId !== null && unlocked.has(entryId);
        const accent = ACCENT_CLASSES[district.accent];
        const isCurrentLocation = mounted && currentDistrictId === district.id;
        const npcs = mounted ? unlockedNpcsForDistrict(district.id) : [];

        return (
          <motion.div
            key={district.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Panel
              className={`p-5 transition-shadow ${districtUnlocked ? accent.glow : 'opacity-60'} ${
                isCurrentLocation ? 'ring-1 ring-arc-cyan/50' : ''
              }`}
              glow={districtUnlocked}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{district.icon}</span>
                  <div>
                    <div
                      className={`font-display text-base font-semibold ${districtUnlocked ? 'text-ink-hi' : 'text-ink-low'}`}
                    >
                      {district.name}
                      {isCurrentLocation && (
                        <span className="ml-2 align-middle text-[10px] uppercase tracking-wider text-arc-cyan">
                          ● You are here
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-low">{district.tagline}</div>
                    <DepartmentBadge districtId={district.id} />
                  </div>
                </div>
                {!districtUnlocked && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-low">
                    🔒 Locked
                  </span>
                )}
              </div>

              {district.missions.length === 0 ? (
                <p className="font-mono text-xs text-ink-low">Coming soon.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {district.missions.map((mission) => {
                    const isUnlocked = unlocked.has(mission.id);
                    const isComplete = completedIds.has(mission.id);
                    const card = (
                      <div
                        className={`rounded-xl border p-3 transition-colors ${
                          isUnlocked
                            ? `${accent.border} hover:border-opacity-60`
                            : 'border-ink-low/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                              isUnlocked
                                ? `${accent.border} ${accent.text}`
                                : 'border-ink-low/20 text-ink-low'
                            }`}
                          >
                            {KIND_LABEL[mission.kind]}
                          </span>
                          {isComplete && <span className="text-accept">✓</span>}
                          {!isUnlocked && <span className="text-ink-low">🔒</span>}
                        </div>
                        <div
                          className={`mt-1.5 font-display text-sm font-medium ${
                            isUnlocked ? 'text-ink-hi' : 'text-ink-low'
                          }`}
                        >
                          {mission.title}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-ink-low">
                          +{mission.xpReward} XP
                        </div>
                      </div>
                    );
                    return isUnlocked ? (
                      <Link
                        key={mission.id}
                        href={mission.href}
                        onClick={() => setCurrentDistrict(district.id)}
                      >
                        {card}
                      </Link>
                    ) : (
                      <div key={mission.id}>{card}</div>
                    );
                  })}
                </div>
              )}

              {npcs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink-low/10 pt-3">
                  {npcs.map((npc) => (
                    <NpcChip key={npc.id} npc={npc} onClick={() => setActiveNpc(npc)} />
                  ))}
                </div>
              )}
            </Panel>
          </motion.div>
        );
      })}

      <NpcDialogueModal npc={activeNpc} onClose={() => setActiveNpc(null)} />
    </div>
  );
}
