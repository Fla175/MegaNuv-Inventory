// lib/hooks/useInventoryDelete.ts
import { useCallback, useState } from "react";
import { UseToast } from "@/lib/context/ToastContext";
import type { InventoryItem } from "@/types/inventory";

export interface DeleteConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  variant: "danger" | "warning" | "info";
  onConfirm: () => void;
}

const CLOSED: DeleteConfirmDialog = {
  isOpen: false,
  title: "",
  message: "",
  variant: "danger",
  onConfirm: () => {},
};

interface UseInventoryDeleteProps {
  onRefresh: () => void;
  /** Runs after a delete succeeds so the caller can close the detail modal. */
  onDeleted?: () => void;
  /** Runs after a batch delete succeeds so the caller can leave selection mode. */
  onBatchDeleted?: () => void;
}

export function useInventoryDelete({
  onRefresh,
  onDeleted,
  onBatchDeleted,
}: UseInventoryDeleteProps) {
  const { showError, showSuccess } = UseToast();
  const [confirmDialog, setConfirmDialog] =
    useState<DeleteConfirmDialog>(CLOSED);

  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const requestDelete = useCallback(
    (item: InventoryItem) => {
      setConfirmDialog({
        isOpen: true,
        title: "Confirmar Exclusão",
        message: `Tem certeza que deseja excluir "${item.name}"? Esta ação é irreversível e o item será removido permanentemente do sistema.`,
        variant: "danger",
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/actives/delete`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: [item.id] }),
            });

            const data = await res.json();

            if (res.ok) {
              onRefresh();
              onDeleted?.();
              showSuccess("Item excluído com sucesso.");
            } else {
              showError(data.error || "Erro ao excluir o item.");
            }
          } catch {
            showError("Erro de conexão ao tentar excluir o item.");
          }
          closeConfirm();
        },
      });
    },
    [onRefresh, onDeleted, showError, showSuccess, closeConfirm]
  );

  const requestBatchDelete = useCallback(
    (selectedIds: string[]) => {
      const count = selectedIds.length;

      setConfirmDialog({
        isOpen: true,
        title: "Confirmar Exclusão em Massa",
        message: `Tem certeza que deseja excluir ${count} ativo${
          count > 1 ? "s" : ""
        }? Esta ação é irreversível e todos os itens selecionados serão removidos permanentemente do sistema.`,
        variant: "danger",
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/actives/delete`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: selectedIds }),
            });

            const data = await res.json();

            if (res.ok) {
              onRefresh();
              onDeleted?.();
              onBatchDeleted?.();
              showSuccess(
                `${count} ativo${count > 1 ? "s" : ""} excluído${
                  count > 1 ? "s" : ""
                } com sucesso.`
              );
            } else {
              showError(data.error || "Erro ao excluir os itens em lote.");
            }
          } catch {
            showError("Erro de conexão ao tentar excluir os itens.");
          }
          closeConfirm();
        },
      });
    },
    [onRefresh, onDeleted, onBatchDeleted, showError, showSuccess, closeConfirm]
  );

  return {
    confirmDialog,
    closeConfirm,
    requestDelete,
    requestBatchDelete,
  };
}
