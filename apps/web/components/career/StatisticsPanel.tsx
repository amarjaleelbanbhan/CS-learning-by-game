'use client';

import { Panel } from '@/components/ui/Panel';
import type { PlayerStatistics } from '@arc/engine-analytics';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-low/15 p-3 text-center">
      <div className="font-mono text-lg text-ink-hi">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-low">{label}</div>
    </div>
  );
}

export function StatisticsPanel({
  statistics,
  missionsCompleted,
}: {
  statistics: PlayerStatistics;
  missionsCompleted: number;
}) {
  const hasDetailedTelemetry = statistics.totalMissions > 0;
  return (
    <Panel className="p-6">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-ink-low">
        Engineer Statistics
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Missions Completed" value={String(missionsCompleted)} />
        <Stat label="Perfect Runs" value={String(statistics.perfectMissions)} />
        <Stat label="Current Streak" value={String(statistics.currentStreak)} />
        <Stat label="Longest Streak" value={String(statistics.longestStreak)} />
        <Stat label="Avg. Attempts" value={statistics.averageAttempts.toFixed(1)} />
        <Stat label="Avg. Hints" value={statistics.averageHintsUsed.toFixed(1)} />
        <Stat
          label="Fastest Solve"
          value={
            statistics.fastestSolveMs ? `${(statistics.fastestSolveMs / 1000).toFixed(1)}s` : '—'
          }
        />
        <Stat
          label="Viz. Usage"
          value={`${Math.round(statistics.visualizationUsageRate * 100)}%`}
        />
      </div>
      {!hasDetailedTelemetry && (
        <p className="mt-4 text-xs text-ink-low">
          Detailed per-attempt analytics (weakest topic, most improved topic, hint trends) populate
          once mission pages start logging attempts to the career engine — instrumentation is a
          flagged next step, not faked here.
        </p>
      )}
      {hasDetailedTelemetry && (
        <p className="mt-4 text-xs text-ink-low">
          Weakest topic: {statistics.mostDifficultTopic ?? '—'} &middot; Most improved:{' '}
          {statistics.mostImprovedTopic ?? '—'}
        </p>
      )}
    </Panel>
  );
}
