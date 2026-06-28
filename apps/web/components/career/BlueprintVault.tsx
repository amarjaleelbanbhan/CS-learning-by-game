'use client';

import { Panel } from '@/components/ui/Panel';
import { BLUEPRINTS } from '@arc/plugin-automata';

const CATEGORY_LABEL: Record<string, string> = {
  tool: 'Tool',
  cosmetic: 'Cosmetic',
  lore: 'Lore',
};

export function BlueprintVault({ earned }: { earned: readonly string[] }) {
  const earnedSet = new Set(earned);
  return (
    <Panel className="p-6">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-ink-low">
        Blueprint Vault
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {BLUEPRINTS.map((bp) => {
          const isUnlocked = earnedSet.has(bp.id);
          return (
            <div
              key={bp.id}
              className={`rounded-xl border p-3 text-center ${
                isUnlocked ? 'border-arc-gold/40 bg-arc-gold/5' : 'border-ink-low/15 opacity-50'
              }`}
            >
              <div className="text-2xl">{isUnlocked ? '🗝️' : '🔒'}</div>
              <div className="mt-1.5 text-sm text-ink-hi">{isUnlocked ? bp.title : '???'}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-low">
                {CATEGORY_LABEL[bp.category]}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
