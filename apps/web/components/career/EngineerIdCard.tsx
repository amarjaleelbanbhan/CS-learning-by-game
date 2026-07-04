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
    <Panel
      glow
      className="p-6 relative overflow-hidden bg-gradient-to-br from-panel to-elevated/40"
    >
      {/* Holographic scanner scanline background */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[size:100%_4px] opacity-25" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-arc-cyan/20 z-0" />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[11px] uppercase tracking-[0.3em] text-ink-low">
              Personnel Dossier
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-arc-cyan animate-pulse-ring" />
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold text-glow tracking-wider text-ink-hi">
            {rank.title}
          </div>
          <div className="mt-1 text-sm text-ink-mid">
            Rank {rankOrder + 1} / {totalRanks} &middot; {labTier.title}
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="font-mono text-lg font-bold text-arc-cyan text-glow">
              {rx.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-ink-low">RX / Reputation</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-bold text-arc-gold">{ec.toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-low">EC / Credits</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6">
        <div className="flex justify-between text-[11px] uppercase tracking-wider text-ink-low font-mono">
          <span>{rank.title}</span>
          <span>{progress.next ? progress.next.title : 'Top Rank'}</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/5 border border-ink-low/10 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-arc-cyan to-arc-gold transition-all duration-700 relative overflow-hidden"
            style={{ width: `${progress.rxProgressPct}%` }}
          >
            {/* Shimmer sweep animation */}
            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shimmer" />
          </div>
        </div>
        {progress.rxSpanToNext !== null && (
          <div className="mt-1 text-right text-[11px] font-mono text-ink-low">
            {progress.rxProgressPct}% to promotion
          </div>
        )}
      </div>

      <p className="relative z-10 mt-4 text-sm leading-relaxed text-ink-mid">
        {labTier.description}
      </p>

      {/* Futuristic dossier telemetry overlay */}
      <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 border-t border-ink-low/15 pt-4 font-mono text-[10px] uppercase tracking-wider text-ink-low sm:grid-cols-4">
        <div>
          <span className="block text-ink-low/60">System Security</span>
          <span className="text-accept font-semibold">● Link Encrypted</span>
        </div>
        <div>
          <span className="block text-ink-low/60">Console ID</span>
          <span className="text-ink-hi">ARC_PERS_ID_v1.0.4</span>
        </div>
        <div>
          <span className="block text-ink-low/60">Sector Status</span>
          <span className="text-arc-cyan font-semibold">● Active Lab</span>
        </div>
        <div>
          <span className="block text-ink-low/60">Telemetry log</span>
          <span className="text-ink-hi">Signal Stable</span>
        </div>
      </div>
    </Panel>
  );
}
