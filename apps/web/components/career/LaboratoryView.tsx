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
    <Panel className="p-6 bg-gradient-to-br from-panel to-elevated/40">
      <div className="relative mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm uppercase tracking-[0.25em] text-ink-low">
            Laboratory Diagnostics
          </h2>
          <div className="mt-1 font-display text-lg font-bold text-glow text-arc-cyan">
            {labTier.title}
          </div>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-ink-low/40">
          SYS_SEC_V3 // ACTIVE_LAB
        </div>
      </div>
      <p className="text-sm leading-relaxed text-ink-mid">{labTier.description}</p>

      {/* Subtle diagnostic separator bar */}
      <div className="my-5 h-[1px] bg-gradient-to-r from-transparent via-arc-cyan/20 to-transparent" />

      <div className="grid gap-3 sm:grid-cols-2">
        {LAB_DECORATIONS.map((d, idx) => {
          const isUnlocked = unlocked.has(d.id);
          const hexId = `0x${(idx + 10).toString(16).toUpperCase()}`;
          return (
            <div
              key={d.id}
              className={`flex items-center justify-between rounded-xl border p-4 text-sm transition-all duration-300 ${
                isUnlocked
                  ? 'border-arc-cyan/30 bg-arc-cyan/5 text-ink-hi shadow-[0_0_12px_rgba(56,225,255,0.06)]'
                  : 'border-ink-low/10 bg-void/30 text-ink-low opacity-75'
              }`}
            >
              <div className="space-y-1">
                <div className="font-mono text-[9px] text-ink-low/50">UNIT_{hexId}</div>
                <div
                  className={`font-semibold tracking-wide ${
                    isUnlocked ? 'text-ink-hi' : 'text-ink-low/60'
                  }`}
                >
                  {isUnlocked ? d.title : 'RESTRICTED_MODULE'}
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px]">
                {isUnlocked ? (
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-accept">
                    <span className="h-1.5 w-1.5 rounded-full bg-accept animate-pulse-ring" />
                    ONLINE
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-ink-low/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-low/30" />
                    OFFLINE
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
