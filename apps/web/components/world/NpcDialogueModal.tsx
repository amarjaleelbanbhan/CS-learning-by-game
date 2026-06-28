'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { NpcDefinition } from '@arc/engine-world';
import { RELATIONSHIP_TIERS, relationshipTierFor } from '@arc/engine-world';
import { useWorldStore } from '@/components/state/worldStore';
import { npcDialogue, relationshipScoreFor } from '@/lib/world/world';
import { HoloButton } from '@/components/ui/HoloButton';

/** Click-to-talk modal for a single NPC — shows their current dialogue line and relationship tier. */
export function NpcDialogueModal({
  npc,
  onClose,
}: {
  npc: NpcDefinition | null;
  onClose: () => void;
}) {
  const world = useWorldStore();
  const talkToNpc = useWorldStore((s) => s.talkToNpc);

  const line = npc ? npcDialogue(npc, world) : null;
  const score = npc ? relationshipScoreFor(npc.id, world) : 0;
  const tier = relationshipTierFor(score);
  const nextTier = RELATIONSHIP_TIERS.find((t) => t.threshold > score);

  return (
    <AnimatePresence>
      {npc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-void/80 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-label={`Conversation with ${npc.name}`}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass max-w-md rounded-2xl border-arc-violet/30 p-6 shadow-glow"
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-arc-violet">
              {npc.role}
            </div>
            <div className="mt-1 font-display text-xl font-bold text-glow">{npc.name}</div>
            <p className="mt-4 text-sm text-ink-hi">{line?.text ?? '…'}</p>
            <div className="mt-4 flex items-center justify-between text-[11px] text-ink-low">
              <span>
                {tier.label}
                {nextTier ? ` · ${nextTier.threshold - score} to ${nextTier.label}` : ' · max'}
              </span>
              <span className="font-mono">{score} rep</span>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <HoloButton
                intent="primary"
                onClick={() => line && talkToNpc(npc.id, line.lineId)}
                disabled={!line}
              >
                Talk
              </HoloButton>
              <HoloButton intent="ghost" onClick={onClose}>
                Close
              </HoloButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
