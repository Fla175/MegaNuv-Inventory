// lib/hooks/useMoveAction.ts
import { useCallback, useMemo, useState } from "react";
import { UseToast } from "@/lib/context/ToastContext";
import type { InventoryItem } from "@/types/inventory";
import { collectActiveSubtreeIds } from "@/lib/inventory/tree";

interface UseMoveActionProps {
  actives: InventoryItem[];
  selectedItems: Set<string>;
  onRefresh: () => void;
  /** Leaves selection mode after a successful batch move. */
  onExitSelectionMode: () => void;
  /** Registers the server timestamp so the undo toast can be shown. */
  showUndo: (
    id: string,
    name: string,
    timestamp: string,
    ids: string[]
  ) => void;
  /** Closes any surface (e.g. the detail modal) that must not stay open. */
  onMoved?: () => void;
}

export function useMoveAction({
  actives,
  selectedItems,
  onRefresh,
  onExitSelectionMode,
  showUndo,
  onMoved,
}: UseMoveActionProps) {
  const { showError, showSuccess } = UseToast();
  const [movingItem, setMovingItem] = useState<InventoryItem | null>(null);
  const [moveExpanded, setMoveExpanded] = useState<Record<string, boolean>>({});
  const [isMovingLoading, setIsMovingLoading] = useState(false);

  const excludedMoveIds = useMemo(() => {
    if (!movingItem) return new Set<string>();
    return collectActiveSubtreeIds(actives, movingItem.id);
  }, [movingItem, actives]);

  const handleMoveAction = useCallback(
    async (targetSpaceId: string, targetParentId?: string) => {
      if (!movingItem) return;

      const isBatch = movingItem.isBatch;

      // Snapshot the selection BEFORE leaving selection mode.
      const selectedIds = Array.from(selectedItems);

      if (isBatch && selectedIds.length === 0) {
        showError("Nenhum ativo foi selecionado.");
        return;
      }

      setIsMovingLoading(true);

      try {
        const payload = isBatch
          ? {
              ids: selectedIds,
              newFatherSpaceId: targetSpaceId,
              newParentId: targetParentId || null,
            }
          : {
              id: movingItem.id,
              newFatherSpaceId: targetSpaceId,
              newParentId: targetParentId || null,
            };

        const res = await fetch("/api/actives/move", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          showError(data.error || "Erro ao mover o ativo.");
          return;
        }

        if (!data.timestamp) {
          console.error("Resposta do move.ts não possui timestamp:", data);
          showError(
            "A movimentação foi realizada, mas o histórico de desfazer não pôde ser preparado."
          );
        } else {
          const undoId = isBatch ? selectedIds.join(",") : movingItem.id;
          const undoName = isBatch
            ? `${selectedIds.length} ativos`
            : movingItem.name;

          showUndo(
            undoId,
            undoName,
            data.timestamp || new Date().toISOString(),
            isBatch ? selectedIds : [movingItem.id]
          );
        }

        onRefresh();
        setMovingItem(null);
        onMoved?.();

        if (isBatch) {
          onExitSelectionMode();
        }

        showSuccess(
          isBatch
            ? `${data.count ?? selectedIds.length} ativo(s) movido(s) com sucesso.`
            : "Ativo movido com sucesso."
        );
      } catch (error) {
        console.error("Erro ao mover ativo:", error);
        showError("Não foi possível conectar ao servidor para mover o ativo.");
      } finally {
        setIsMovingLoading(false);
      }
    },
    [
      movingItem,
      selectedItems,
      onRefresh,
      onExitSelectionMode,
      showUndo,
      onMoved,
      showError,
      showSuccess,
    ]
  );

  return {
    movingItem,
    setMovingItem,
    moveExpanded,
    setMoveExpanded,
    isMovingLoading,
    excludedMoveIds,
    handleMoveAction,
  };
}
