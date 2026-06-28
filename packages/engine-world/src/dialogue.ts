/**
 * Dynamic dialogue selection. Dialogue must evolve as the player progresses and never
 * repeat identically forever — both are structural guarantees here, not just content
 * authoring discipline:
 *
 *  - SPECIFICITY: among every line an NPC is currently eligible to say, the most
 *    advanced one (highest rank/relationship gate) wins, so "Cadet" generic lines stop
 *    showing the moment a "Chief Engineer" line becomes eligible.
 *  - ANTI-REPEAT: when several lines tie at the same specificity, the one matching the
 *    NPC's last-shown line is skipped if any alternative exists.
 */
import type { NpcMemory } from './npc.js';

export interface DialogueLine {
  readonly id: string;
  readonly text: string;
  readonly minRankOrder?: number;
  readonly minRelationshipScore?: number;
  /** Only eligible while this world event is active; lets dialogue reference world events. */
  readonly worldEventId?: string;
}

export interface DialogueSelectionContext {
  readonly rankOrder: number;
  readonly relationshipScore: number;
  readonly activeWorldEventId: string | null;
  readonly memory: NpcMemory;
  /** Deterministic variety seed (e.g. conversation count) for tie-breaking. */
  readonly seed: number;
}

function isEligible(line: DialogueLine, ctx: DialogueSelectionContext): boolean {
  if (line.worldEventId !== undefined && line.worldEventId !== ctx.activeWorldEventId) {
    return false;
  }
  if (line.minRankOrder !== undefined && ctx.rankOrder < line.minRankOrder) return false;
  if (
    line.minRelationshipScore !== undefined &&
    ctx.relationshipScore < line.minRelationshipScore
  ) {
    return false;
  }
  return true;
}

function specificity(line: DialogueLine): number {
  return (
    (line.minRankOrder ?? 0) + (line.minRelationshipScore ?? 0) + (line.worldEventId ? 1000 : 0)
  );
}

/** Every line the NPC could currently say, most specific first. */
export function eligibleLines(
  lines: readonly DialogueLine[],
  ctx: DialogueSelectionContext,
): readonly DialogueLine[] {
  return lines.filter((l) => isEligible(l, ctx)).sort((a, b) => specificity(b) - specificity(a));
}

/**
 * The single line to show right now: the most specific eligible tier, varied by seed,
 * avoiding an immediate repeat of the last line shown when an alternative exists at the
 * same tier. Returns null if the NPC has nothing eligible to say (host should fall back
 * to a generic greeting).
 */
export function selectDialogueLine(
  lines: readonly DialogueLine[],
  ctx: DialogueSelectionContext,
): DialogueLine | null {
  const eligible = eligibleLines(lines, ctx);
  if (eligible.length === 0) return null;

  const topSpecificity = specificity(eligible[0]!);
  const tier = eligible.filter((l) => specificity(l) === topSpecificity);

  const withoutRepeat = tier.filter((l) => l.id !== ctx.memory.lastLineId);
  const pool = withoutRepeat.length > 0 ? withoutRepeat : tier;

  return pool[ctx.seed % pool.length]!;
}
