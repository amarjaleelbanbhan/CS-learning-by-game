/**
 * Generic unlock graph — "this thing becomes available once these other
 * things are done." Used for the campaign's district/mission unlock logic,
 * but deliberately has no idea what a "district" or "mission" is: it just
 * sees ids and dependencies. Mirrors the shape of `plugin-sdk`'s
 * `SkillTreeSpec` without importing it (engines must not depend on plugins).
 */
export interface UnlockNode {
  readonly id: string;
  readonly dependsOn: readonly string[];
}

/**
 * A node is unlocked once every id it depends on is in `completedIds`. Nodes
 * with no dependencies are always unlocked. Missing/unknown dependency ids
 * are treated as never-satisfied (fail closed, not open).
 */
export function isUnlocked(node: UnlockNode, completedIds: ReadonlySet<string>): boolean {
  return node.dependsOn.every((dep) => completedIds.has(dep));
}

/** The full set of currently-unlocked node ids across a graph. */
export function computeUnlocked(
  nodes: readonly UnlockNode[],
  completedIds: ReadonlySet<string>,
): Set<string> {
  const unlocked = new Set<string>();
  for (const node of nodes) {
    if (isUnlocked(node, completedIds)) unlocked.add(node.id);
  }
  return unlocked;
}

/** Detects cycles / dangling dependencies — run in CI against campaign content. */
export function validateUnlockGraph(nodes: readonly UnlockNode[]): string[] {
  const errors: string[] = [];
  const ids = new Set(nodes.map((n) => n.id));
  const idCounts = new Map<string, number>();

  for (const node of nodes) {
    idCounts.set(node.id, (idCounts.get(node.id) ?? 0) + 1);
    for (const dep of node.dependsOn) {
      if (!ids.has(dep)) errors.push(`Node "${node.id}" depends on unknown id "${dep}"`);
    }
  }
  for (const [id, count] of idCounts) {
    if (count > 1) errors.push(`Duplicate node id "${id}"`);
  }

  // Cycle detection via DFS.
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>(nodes.map((n) => [n.id, WHITE]));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const visit = (id: string, stack: string[]): void => {
    if (color.get(id) === BLACK) return;
    if (color.get(id) === GRAY) {
      errors.push(`Cycle detected: ${[...stack, id].join(' -> ')}`);
      return;
    }
    color.set(id, GRAY);
    const node = byId.get(id);
    if (node) for (const dep of node.dependsOn) visit(dep, [...stack, id]);
    color.set(id, BLACK);
  };
  for (const node of nodes) visit(node.id, []);

  return errors;
}
