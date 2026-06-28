'use client';

import type { NpcDefinition } from '@arc/engine-world';

export function NpcChip({ npc, onClick }: { npc: NpcDefinition; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-arc-violet/25 bg-arc-violet/5 px-2.5 py-1 text-[11px] text-ink-mid transition-colors hover:border-arc-violet/50 hover:text-ink-hi"
    >
      👤 {npc.name}
    </button>
  );
}
