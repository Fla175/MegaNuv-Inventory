// lib/inventory/tree.ts
//
// Pure hierarchy helpers for inventory items. They are kept out of the hooks
// so selection cascades and move exclusions can be tested without React.

export interface ActiveNodeLike {
  id: string;
  parentId?: string | null;
  isPhysicalSpace?: boolean;
}

/**
 * IDs pulled by selecting `parentId` in selection mode.
 *
 * Direct children always come in. Recursion continues only through physical
 * spaces, preserving the original `useInventorySelection` rule.
 */
export function collectSelectionChildIds(
  actives: readonly ActiveNodeLike[],
  parentId: string
): string[] {
  const children = actives.filter((active) => active.parentId === parentId);
  let ids: string[] = [];

  children.forEach((child) => {
    ids.push(child.id);
    if (child.isPhysicalSpace) {
      ids = [...ids, ...collectSelectionChildIds(actives, child.id)];
    }
  });

  return ids;
}

/**
 * The moved item plus every descendant, used to disable invalid move targets.
 * Unlike the selection cascade, this follows every child.
 */
export function collectActiveSubtreeIds(
  actives: readonly ActiveNodeLike[],
  rootId: string
): Set<string> {
  const ids = new Set<string>([rootId]);
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    actives.forEach((active) => {
      if (active.parentId === currentId) {
        ids.add(active.id);
        queue.push(active.id);
      }
    });
  }

  return ids;
}
