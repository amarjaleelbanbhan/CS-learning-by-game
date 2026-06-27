'use client';

import { HINT_KIND_ORDER, unlockedHintTier, type HintSpec } from '@arc/engine-assessment';
import { HoloButton } from '@/components/ui/HoloButton';

const TIER_LABEL: Record<string, string> = {
  'tiny-hint': 'Tiny hint',
  question: 'A question to sit with',
  'highlight-state': 'Look here',
  'highlight-transition': 'Trace this',
  'animate-idea': 'Watch this',
  visualization: 'Full reveal',
};

export interface HintPanelProps {
  hints: readonly HintSpec[];
  failedAttempts: number;
  revealedTier: number;
  onReveal: (tier: number) => void;
}

/**
 * Never shows a hint the player hasn't earned. `unlockedHintTier` is the only
 * source of truth for what's available; this panel just renders it as a
 * locked ladder so the player can see what's still ahead without reading it.
 */
export function HintPanel({ hints, failedAttempts, revealedTier, onReveal }: HintPanelProps) {
  const unlocked = unlockedHintTier(failedAttempts);

  if (unlocked === -1) {
    return (
      <p className="font-mono text-xs text-ink-low">
        Give it a try first — hints unlock after your first attempt.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {HINT_KIND_ORDER.map((kind, tier) => {
        const isUnlocked = tier <= unlocked;
        const isRevealed = tier <= revealedTier;
        const hint = hints[tier];
        if (!isUnlocked) {
          return (
            <div
              key={kind}
              className="flex items-center gap-2 rounded-lg border border-ink-low/10 px-3 py-2 text-xs text-ink-low/40"
            >
              <span>🔒</span>
              <span>{TIER_LABEL[kind]}</span>
            </div>
          );
        }
        if (!isRevealed) {
          return (
            <button
              key={kind}
              onClick={() => onReveal(tier)}
              className="flex w-full items-center justify-between rounded-lg border border-arc-cyan/30 bg-arc-cyan/5 px-3 py-2 text-left text-xs text-arc-cyan transition-colors hover:bg-arc-cyan/10"
            >
              <span>
                {TIER_LABEL[kind]} <span className="text-ink-low">— unlocked</span>
              </span>
              <span>reveal →</span>
            </button>
          );
        }
        return (
          <div key={kind} className="rounded-lg border border-arc-cyan/20 bg-void/50 px-3 py-2">
            <div className="mb-1 font-display text-[10px] uppercase tracking-wider text-arc-cyan/80">
              {TIER_LABEL[kind]}
            </div>
            <p className="text-xs text-ink-hi">{hint?.text}</p>
          </div>
        );
      })}
      {unlocked < HINT_KIND_ORDER.length - 1 && (
        <p className="font-mono text-[11px] text-ink-low">
          Next hint unlocks after your next attempt.
        </p>
      )}
    </div>
  );
}

export function HintTriggerButton({
  failedAttempts,
  open,
  onToggle,
}: {
  failedAttempts: number;
  open: boolean;
  onToggle: () => void;
}) {
  const unlocked = unlockedHintTier(failedAttempts);
  return (
    <HoloButton intent="ghost" onClick={onToggle} className="text-xs">
      {open
        ? 'Hide hints'
        : unlocked === -1
          ? 'Hints (try first)'
          : `Hints (${unlocked + 1} available)`}
    </HoloButton>
  );
}
