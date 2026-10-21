// lib/hooks/useMoveAction.ts
import { useState, useMemo } from "react";
import type { InventoryItem } from "@/types/inventory";

interface UseMoveActionProps {
  actives: InventoryItem[];
}

export function useMoveAction({ actives }: UseMoveActionProps) {
  const [movingItem, setMovingItem] = useState<InventoryItem | null>(null);
  const [moveExpanded, setMoveExpanded] = useState<Record<string, boolean>>({});
  const [isMovingLoading, setIsMovingLoading] = useState(false);

  const excludedMoveIds = useMemo(() => {
    if (!movingItem) return new Set<string>();
    const ids = new Set<string>([movingItem.id]);
    const queue = [movingItem.id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      actives.forEach((a) => {
        if (a.parentId === currentId) {
          ids.add(a.id);
          queue.push(a.id);
        }
      });
    }
    return ids;
  }, [movingItem, actives]);

  return {
    movingItem,
    setMovingItem,
    moveExpanded,
    setMoveExpanded,
    isMovingLoading,
    setIsMovingLoading,
    excludedMoveIds,
  };
}
