'use client';

import { useEffect, useRef } from 'react';
import { useHasMounted } from '@/components/hud/useHasMounted';
import { ariaBeginSession, ariaGreet } from '@/lib/companion/mentorActions';

/**
 * Opens an ARIA session once per app load: begins a memory session and delivers a
 * context-aware, grounded greeting through the companion. Mounted once in the root layout
 * alongside the other watchers. Waits for client mount so persisted memory is hydrated
 * before ARIA decides what to say (no SSR/hydration mismatch, no fabricated state).
 *
 * The route is read from window.location inside the effect (client-only) rather than via
 * usePathname() — this component sits directly in the root-layout <body>, where the hook
 * would force a hydration deopt of the whole document.
 */
export function MentorWatcher() {
  const mounted = useHasMounted();
  const greeted = useRef(false);

  useEffect(() => {
    if (!mounted || greeted.current) return;
    greeted.current = true;

    // On a mission page, the mission delivers its own briefing as ARIA's first words —
    // skip the generic greeting so the two don't collide in the single companion bubble.
    // (begin() still records the session so memory/streaks stay accurate.)
    if (window.location.pathname.startsWith('/learn')) {
      ariaBeginSession();
      return;
    }

    // Defer slightly so the boot sequence / first paint settle before ARIA speaks.
    const t = setTimeout(() => ariaGreet(), 1200);
    return () => clearTimeout(t);
  }, [mounted]);

  return null;
}
