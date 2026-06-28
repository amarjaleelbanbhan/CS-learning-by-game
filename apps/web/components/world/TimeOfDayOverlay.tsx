'use client';

import { useEffect, useState } from 'react';
import type { TimeOfDay } from '@arc/engine-world';
import { academyTimeOfDay } from '@/lib/world/world';
import { useHasMounted } from '@/components/hud/useHasMounted';

const TINT: Record<TimeOfDay, string> = {
  morning: 'rgba(255,194,75,0.04)',
  afternoon: 'rgba(56,225,255,0.0)',
  evening: 'rgba(155,107,255,0.05)',
  night: 'rgba(11,18,32,0.25)',
};

/**
 * Subtle full-screen tint that shifts with the academy's day cycle. Static gradient, no
 * animation loop — cheap enough to leave running and nothing for prefers-reduced-motion
 * to need to disable.
 */
export function TimeOfDayOverlay() {
  const mounted = useHasMounted();
  const [tod, setTod] = useState<TimeOfDay>('afternoon');

  useEffect(() => {
    const update = () => setTod(academyTimeOfDay());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] transition-colors duration-[3000ms]"
      style={{ backgroundColor: TINT[tod] }}
    />
  );
}
