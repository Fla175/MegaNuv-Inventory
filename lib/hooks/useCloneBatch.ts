// lib/hooks/useCloneBatch.ts
import { useState, useCallback, useMemo } from "react";
import { UseToast } from "@/lib/context/ToastContext";

import type { InventoryItem, FatherSpace } from "@/types/inventory";
import type { SearchableSelectOption } from "@/lib/searchableSelect";

interface UseCloneBatchProps {
  selectedItems: Set<string>;
  fatherSpaces: FatherSpace[];
  actives: InventoryItem[];
  onRefresh: () => void;
  /** Called after a successful clone so the caller can leave selection mode. */
  onCloned?: () => void;
}

export function useCloneBatch({
  selectedItems,
  fatherSpaces,
  actives,
  onRefresh,
  onCloned,
}: UseCloneBatchProps) {
  const { showError, showSuccess } = UseToast();
  const [isCloneBatchOpen, setIsCloneBatchOpen] = useState(false);
  const [cloneQuantity, setCloneQuantity] = useState<number>(1);
  const [cloneDestinationSpaceId, setCloneDestinationSpaceId] =
    useState<string>("");
  const [isCloning, setIsCloning] = useState(false);

  const cloneLocationOptions = useMemo<SearchableSelectOption[]>(() => {
    return [
      {
        id: "",
        name: "Manter no espaço original de cada um",
        type: "default" as const,
        parentId: null,
      },
      ...fatherSpaces.map((s) => ({
        id: s.id,
        name: s.name,
        type: "space" as const,
        parentId: null,
      })),
      ...actives
        .filter((a) => a.isPhysicalSpace)
        .map((a) => ({
          id: a.id,
          name: a.name,
          type: "active" as const,
          parentId: a.parentId || a.fatherSpaceId || null,
        })),
    ];
  }, [fatherSpaces, actives]);

  const handleBatchClone = useCallback(async () => {
    if (selectedItems.size === 0) return;

    try {
      setIsCloning(true);

      let destSpaceId: string | undefined = undefined;
      if (cloneDestinationSpaceId) {
        const [id] = cloneDestinationSpaceId.split(":");
        destSpaceId = id;
      }

      const selectedIds = Array.from(selectedItems);

      const response = await fetch("/api/actives/clone-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeIds: selectedIds,
          quantity: cloneQuantity,
          destinationSpaceId: destSpaceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao clonar em lote");
      }

      showSuccess(`${data.count} ativo(s) clonado(s) com sucesso!`);
      setIsCloneBatchOpen(false);
      onCloned?.();
      onRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao processar clonagem";
      showError(msg);
    } finally {
      setIsCloning(false);
    }
  }, [selectedItems, cloneDestinationSpaceId, cloneQuantity, onRefresh, onCloned, showError, showSuccess]);

  return {
    isCloneBatchOpen,
    setIsCloneBatchOpen,
    cloneQuantity,
    setCloneQuantity,
    cloneDestinationSpaceId,
    setCloneDestinationSpaceId,
    isCloning,
    handleBatchClone,
    cloneLocationOptions,
  };
}
