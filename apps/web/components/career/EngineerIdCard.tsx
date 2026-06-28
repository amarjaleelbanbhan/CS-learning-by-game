'use client';

import { Panel } from '@/components/ui/Panel';
import type { RankDefinition, RankProgress, LabTierDefinition } from '@arc/engine-progress';

export function EngineerIdCard({
  rank,
  progress,
  labTier,
  rx,
  ec,
  rankOrder,
  totalRanks,
}: {
  rank: RankDefinition;
  progress: RankProgress;
  labTier: LabTierDefinition;
  rx: number;
  ec: number;
  rankOrder: number;
  totalRanks: number;
}) {
  return (
    <Panel glow className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-ink-low">Engineer ID</div>
          <div className="mt-1 font-display text-2xl font-extrabold text-glow">{rank.title}</div>
          <div className="mt-1 text-sm text-ink-mid">
            Rank {rankOrder + 1} / {totalRanks} &middot; {labTier.title}
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="font-mono text-lg text-arc-cyan">{rx.toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-low">RX</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg text-arc-gold">{ec.toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-low">EC</div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-[11px] uppercase tracking-wider text-ink-low">
          <span>{rank.title}</span>
          <span>{progress.next ? progress.next.title : 'Top Rank'}</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-arc-cyan to-arc-gold transition-all duration-700"
            style={{ width: `${progress.rxProgressPct}%` }}
          />
        </div>
        {progress.rxSpanToNext !== null && (
          <div className="mt-1 text-right text-[11px] text-ink-low">
            {progress.rxProgressPct}% to promotion
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-ink-mid">{labTier.description}</p>
    </Panel>
  );
}
