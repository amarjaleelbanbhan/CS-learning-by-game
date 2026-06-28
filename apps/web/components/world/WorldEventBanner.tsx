'use client';

import { useEffect, useState } from 'react';
import { nextRotationAt } from '@arc/engine-world';
import { currentWorldEvent } from '@/lib/world/world';
import { Panel } from '@/components/ui/Panel';
import { useHasMounted } from '@/components/hud/useHasMounted';

/** Live academy-wide event banner — the same event for every player this rotation window. */
export function WorldEventBanner() {
  const mounted = useHasMounted();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;
  const event = currentWorldEvent(now);
  if (!event) return null;

  const hoursLeft = Math.max(0, Math.round((nextRotationAt(now) - now) / 3_600_000));

  return (
    <Panel className="border-arc-gold/25 bg-arc-gold/5 p-4" glow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-arc-gold">Academy Event</div>
          <div className="font-display text-sm font-semibold text-ink-hi">{event.title}</div>
          <p className="mt-0.5 text-xs text-ink-mid">{event.description}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm text-arc-gold">
            ×{event.rewardMultiplier.toFixed(2)}
          </div>
          <div className="text-[10px] text-ink-low">rewards · ~{hoursLeft}h left</div>
        </div>
      </div>
    </Panel>
  );
}
