// lib/hooks/useInventorySelection.ts
import { useState, useCallback } from "react";

interface UseInventorySelectionProps {
  actives: { id: string; parentId?: string | null; isPhysicalSpace?: boolean }[];
}

/**
 * Gerencia seleção única e múltipla de itens no ListSection, incluindo:
 * - Seleção individual com checkbox
 * - Seleção de espaço físico puxa todos os filhos (recursivo)
 * - Long press (1s) para ativar modo de seleção no mobile
 * - Limpeza da seleção
 */
export function useInventorySelection({
  actives,
}: UseInventorySelectionProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [longPressItem, setLongPressItem] = useState<string | null>(null);

  const getAllChildIds = useCallback(
    (parentId: string): string[] => {
      const children = actives.filter((a) => a.parentId === parentId);
      let ids: string[] = [];
      children.forEach((child) => {
        ids.push(child.id);
        if (child.isPhysicalSpace) {
          ids = [...ids, ...getAllChildIds(child.id)];
        }
      });
      return ids;
    },
    [actives]
  );

  const activateSelectionMode = useCallback((itemId: string) => {
    setIsSelectionMode(true);
    setSelectedItems(new Set([itemId]));
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  }, []);

  const handleLongPressStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, activeId: string) => {
      if (isSelectionMode) return;
      e.preventDefault();
      const timer = setTimeout(() => {
        activateSelectionMode(activeId);
        setLongPressItem(null);
      }, 1000);
      setLongPressTimer(timer);
      setLongPressItem(activeId);
    },
    [isSelectionMode, activateSelectionMode]
  );

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressItem(null);
  }, [longPressTimer]);

  const handleCheckboxChange = useCallback(
    (checked: boolean, activeId: string, isPhysicalSpace: boolean) => {
      const childIds = isPhysicalSpace ? getAllChildIds(activeId) : [];

      setSelectedItems((prev) => {
        const next = new Set(prev);

        if (checked) {
          next.add(activeId);
          childIds.forEach((id) => next.add(id));
        } else {
          next.delete(activeId);
          childIds.forEach((id) => next.delete(id));
        }

        return next;
      });
    },
    [getAllChildIds]
  );

  const toggleSingleSelection = useCallback(
    (id: string, checked: boolean) => {
      setSelectedItems((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    []
  );

  return {
    isSelectionMode,
    selectedItems,
    longPressTimer,
    longPressItem,
    setIsSelectionMode,
    setSelectedItems,
    setLongPressTimer,
    setLongPressItem,
    activateSelectionMode,
    exitSelectionMode,
    handleLongPressStart,
    handleLongPressEnd,
    handleCheckboxChange,
    toggleSingleSelection,
  };
}
