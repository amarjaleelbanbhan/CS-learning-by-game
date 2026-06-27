'use client';

import Link from 'next/link';
import { levelFromXp, useGameStore } from '@/components/state/gameStore';
import { useSoundMuted } from '@/lib/fx/sound';
import { ArcRing } from './ArcRing';
import { useHasMounted } from './useHasMounted';

export function TopBar() {
  const mounted = useHasMounted();
  const xp = useGameStore((s) => s.xp);
  const coins = useGameStore((s) => s.coins);
  const [muted, toggleMuted] = useSoundMuted();
  const { level, into, span } = levelFromXp(mounted ? xp : 0);

  return (
    <header className="sticky top-0 z-40 border-b border-arc-cyan/10 bg-void/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-full border border-arc-cyan/40 shadow-glow">
            <div className="h-3.5 w-3.5 rounded-full bg-arc-cyan shadow-[0_0_12px_4px_rgba(56,225,255,0.7)] animate-pulse-ring" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-extrabold tracking-widest text-glow">
              ARC REACTOR
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-low">
              Theory of Automata
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleMuted}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            className="grid h-8 w-8 place-items-center rounded-full border border-ink-low/25 text-ink-mid transition-colors hover:border-arc-cyan/40 hover:text-ink-hi"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <div className="hidden items-center gap-2 rounded-full border border-arc-gold/30 bg-arc-gold/5 px-3 py-1.5 sm:flex">
            <span className="text-arc-gold">◈</span>
            <span className="font-mono text-sm text-ink-hi">{mounted ? coins : 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <ArcRing level={level} progress={span > 0 ? into / span : 0} />
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="font-mono text-xs text-ink-mid">{mounted ? xp : 0} XP</span>
              <span className="text-[10px] uppercase tracking-wider text-ink-low">
                Level {level}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
