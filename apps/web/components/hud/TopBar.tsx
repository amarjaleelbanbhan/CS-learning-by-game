'use client';

import Link from 'next/link';
import { levelFromXp, useGameStore } from '@/components/state/gameStore';
import { useSoundMuted } from '@/lib/fx/sound';
import { ArcRing } from './ArcRing';
import { useHasMounted } from './useHasMounted';
import { AuthButton } from '@/components/auth/AuthButton';

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
          <AuthButton />
          <Link
            href="/career"
            className="hidden text-xs uppercase tracking-wider text-ink-mid transition-all duration-300 hover:text-arc-cyan hover:text-glow sm:inline"
          >
            Engineer Console
          </Link>
          <button
            onClick={toggleMuted}
            aria-label={mounted && muted ? 'Unmute sound' : 'Mute sound'}
            className="group grid h-9 w-9 place-items-center rounded-full border border-ink-low/25 text-ink-mid transition-all duration-200 hover:border-arc-cyan/40 hover:text-arc-cyan hover:shadow-glow"
          >
            {mounted && muted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-ink-low transition-colors group-hover:text-reject"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-arc-cyan"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className="animate-pulse" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" className="opacity-70 animate-pulse" />
              </svg>
            )}
          </button>
          <div className="hidden items-center gap-2 rounded-full border border-arc-gold/30 bg-arc-gold/5 px-3 py-1.5 transition-all duration-300 hover:border-arc-gold/60 hover:bg-arc-gold/10 hover:shadow-[0_0_12px_rgba(255,194,75,0.15)] sm:flex">
            <span className="text-arc-gold animate-pulse">◈</span>
            <span className="font-mono text-sm text-ink-hi">{mounted ? coins : 0}</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="transition-transform duration-300 group-hover:scale-105">
              <ArcRing level={level} progress={span > 0 ? into / span : 0} />
            </div>
            <div className="hidden flex-col leading-tight sm:flex transition-all duration-300 group-hover:text-shadow-glow">
              <span className="font-mono text-xs text-ink-mid group-hover:text-arc-cyan transition-colors">
                {mounted ? xp : 0} XP
              </span>
              <span className="text-[10px] uppercase tracking-wider text-ink-low group-hover:text-ink-hi transition-colors">
                Level {level}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
