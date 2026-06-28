/**
 * World reactions — when the player earns a certification, defeats a boss, gets
 * promoted, unlocks a district, or completes a semester, the world should visibly react.
 * This module turns a real trigger into a grounded announcement string: every word comes
 * from the trigger's own fields, never invented, mirroring the same "grounding"
 * discipline used by the ARIA mentor engine.
 */
export type WorldReactionKind =
  | 'certification'
  | 'boss-victory'
  | 'promotion'
  | 'district-unlock'
  | 'semester-complete';

export interface WorldReactionTrigger {
  readonly kind: WorldReactionKind;
  /** The real, specific thing that happened — a cert title, rank title, district name, etc. */
  readonly label: string;
  readonly districtId?: string;
}

export interface WorldReaction {
  readonly kind: WorldReactionKind;
  readonly announcement: string;
  readonly relatedDepartmentId?: string;
}

const TEMPLATES: Record<WorldReactionKind, (label: string) => string> = {
  certification: (label) => `Academy Records: ${label} certification logged.`,
  'boss-victory': (label) => `Academy Bulletin: ${label} has fallen. Word is already spreading.`,
  promotion: (label) => `Academy Records: promotion confirmed — ${label}.`,
  'district-unlock': (label) => `New access granted: ${label} is now open to you.`,
  'semester-complete': (label) => `Academy Records: ${label} complete. The next semester begins.`,
};

export function generateWorldReaction(trigger: WorldReactionTrigger): WorldReaction {
  return {
    kind: trigger.kind,
    announcement: TEMPLATES[trigger.kind](trigger.label),
    relatedDepartmentId: trigger.districtId,
  };
}
