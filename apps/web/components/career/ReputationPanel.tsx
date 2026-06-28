'use client';

import { Panel } from '@/components/ui/Panel';
import type { DepartmentDefinition, ReputationTier } from '@arc/engine-progress';

export function ReputationPanel({
  departments,
}: {
  departments: readonly {
    department: DepartmentDefinition;
    score: number;
    tier: ReputationTier | undefined;
  }[];
}) {
  return (
    <Panel className="p-6">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-ink-low">
        Academy Reputation
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {departments.map(({ department, score, tier }) => {
          const nextTier = department.tiers.find((t) => t.threshold > score);
          const floor = tier?.threshold ?? 0;
          const span = nextTier ? nextTier.threshold - floor : 1;
          const pct = nextTier ? Math.min(100, Math.round(((score - floor) / span) * 100)) : 100;
          return (
            <div key={department.id} className="rounded-xl border border-ink-low/15 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-hi">{department.label}</span>
                <span className="text-[11px] uppercase tracking-wider text-arc-cyan">
                  {tier?.label ?? 'Unranked'}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-arc-cyan/70" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-ink-low">
                {score} rep
                {nextTier ? ` · ${nextTier.threshold - score} to ${nextTier.label}` : ' · max tier'}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
