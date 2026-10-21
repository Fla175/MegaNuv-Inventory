// lib/settings/revert.ts
import type { RevertItem, RevertSubItem } from "@/lib/revert/types";

/** History rows selected by the checkbox set. */
export function selectRevertItems(
  items: readonly RevertItem[],
  selected: ReadonlySet<string>
): RevertItem[] {
  return items.filter((item) => {
    const key = item.groupId || item.id;
    return !!key && selected.has(key);
  });
}

/** Flattens individual rows and batches into the POST payload. */
export function buildRevertPayload(items: readonly RevertItem[]): RevertSubItem[] {
  return items.flatMap((item) => {
    if (item.items && item.items.length > 0) {
      return item.items;
    }
    return [{ table: item.table!, id: item.id!, timestamp: item.timestamp }];
  });
}
