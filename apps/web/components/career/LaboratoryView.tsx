'use client';

import { LAB_DECORATIONS } from '@arc/plugin-automata';
import { Panel } from '@/components/ui/Panel';
import type { LabTierDefinition } from '@arc/engine-progress';

/** Makes laboratory evolution visible: itemized equipment/decorations per tier, not just prose. */
export function LaboratoryView({
  labTier,
  unlockedDecorationIds,
}: {
  labTier: LabTierDefinition;
  unlockedDecorationIds: readonly string[];
}) {
  const unlocked = new Set(unlockedDecorationIds);

  return (
    <Panel className="p-6">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-ink-low">
        Laboratory — {labTier.title}
      </h2>
      <p className="mt-2 text-sm text-ink-mid">{labTier.description}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {LAB_DECORATIONS.map((d) => {
          const isUnlocked = unlocked.has(d.id);
          return (
            <div
              key={d.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
                isUnlocked
                  ? 'border-arc-cyan/30 bg-arc-cyan/5 text-ink-hi'
                  : 'border-ink-low/15 text-ink-low'
              }`}
            >
              <span>{isUnlocked ? d.title : '???'}</span>
              <span className="text-[11px] uppercase tracking-wider">
                {isUnlocked ? `Tier ${d.labTier}` : 'Locked'}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
