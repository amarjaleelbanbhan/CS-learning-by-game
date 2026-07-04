'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { rankById } from '@arc/engine-progress';
import { RANK_LADDER } from '@arc/plugin-automata';
import { useGameStore } from '@/components/state/gameStore';
import { careerSnapshot, useCareerStore } from '@/components/state/careerStore';
import { useHasMounted } from '@/components/hud/useHasMounted';
import { EngineerIdCard } from '@/components/career/EngineerIdCard';
import { ReputationPanel } from '@/components/career/ReputationPanel';
import { CertificationsPanel } from '@/components/career/CertificationsPanel';
import { BlueprintVault } from '@/components/career/BlueprintVault';
import { StatisticsPanel } from '@/components/career/StatisticsPanel';
import { LaboratoryView } from '@/components/career/LaboratoryView';
import { unlockedDecorationIds } from '@/lib/world/world';
import { playSfx } from '@/lib/fx/sound';

type Tab = 'reputation' | 'certifications' | 'blueprints' | 'statistics' | 'laboratory';

const TABS: { id: Tab; label: string; code: string }[] = [
  { id: 'reputation', label: 'Academy Records', code: 'REC-01' },
  { id: 'certifications', label: 'Certification Archive', code: 'SEC-02' },
  { id: 'blueprints', label: 'Blueprint Vault', code: 'BLP-03' },
  { id: 'statistics', label: 'Mission Control', code: 'STA-04' },
  { id: 'laboratory', label: 'Laboratory', code: 'LAB-05' },
];

export default function CareerPage() {
  const mounted = useHasMounted();
  const [tab, setTab] = useState<Tab>('reputation');
  const xp = useGameStore((s) => s.xp);
  const coins = useGameStore((s) => s.coins);
  const completed = useGameStore((s) => s.completed);
  const careerState = useCareerStore();

  if (!mounted) return null;

  const snapshot = careerSnapshot(xp, coins, careerState);
  const missionsCompleted = Object.values(completed).filter(Boolean).length;
  const topRankOrder = rankById(
    RANK_LADDER,
    RANK_LADDER.ranks[RANK_LADDER.ranks.length - 1]!.id,
  )!.order;

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] uppercase tracking-[0.3em] text-arc-cyan">Engineer Console</div>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-glow">Career Terminal</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-mid">
          Your standing across the Academy — rank, reputation, certifications, and the research
          you've unlocked.
        </p>
      </header>

      <EngineerIdCard
        rank={snapshot.rank}
        progress={snapshot.progress}
        labTier={snapshot.labTier}
        rx={xp}
        ec={coins}
        rankOrder={snapshot.rank.order}
        totalRanks={topRankOrder + 1}
      />

      {snapshot.unmetPromotionRequirements.length > 0 && (
        <div className="rounded-xl border border-ink-low/15 bg-white/[0.02] p-4 text-sm text-ink-mid">
          <span className="text-ink-low">Next promotion requires:</span>{' '}
          {snapshot.unmetPromotionRequirements.join(' · ')}
        </div>
      )}

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                playSfx('click');
                setTab(t.id);
              }}
              className={`group relative rounded-lg border px-3.5 py-1.5 text-sm font-mono tracking-wider transition-all duration-300 ${
                isActive
                  ? 'border-arc-cyan/50 text-arc-cyan shadow-[0_0_12px_rgba(56,225,255,0.15)]'
                  : 'border-ink-low/15 text-ink-mid hover:border-arc-cyan/30 hover:text-ink-hi'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeTabBackdrop"
                  className="absolute inset-0 rounded-lg bg-arc-cyan/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span
                  className={`text-[9px] opacity-60 ${
                    isActive ? 'text-arc-cyan' : 'text-ink-low group-hover:text-arc-cyan/70'
                  }`}
                >
                  [{t.code}]
                </span>
                <span>{t.label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {tab === 'reputation' && <ReputationPanel departments={snapshot.departments} />}
      {tab === 'certifications' && (
        <CertificationsPanel earned={careerState.earnedCertifications} />
      )}
      {tab === 'blueprints' && <BlueprintVault earned={careerState.earnedBlueprints} />}
      {tab === 'statistics' && (
        <StatisticsPanel statistics={snapshot.statistics} missionsCompleted={missionsCompleted} />
      )}
      {tab === 'laboratory' && (
        <LaboratoryView
          labTier={snapshot.labTier}
          unlockedDecorationIds={unlockedDecorationIds()}
        />
      )}
    </div>
  );
}
