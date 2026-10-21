// lib/hooks/useSettingsDelete.ts
import { useCallback, useState } from "react";
import { UseToast } from "@/lib/context/ToastContext";
import type { ConfirmState } from "@/components/settings/types";
import { buildSpaceDeleteMessage } from "@/lib/settings/deletePreview";

type DeleteType = "user" | "space" | "category" | "logs";

interface UseSettingsDeleteParams {
  currentUserId?: string;
  refreshActiveTabData: () => void;
  refreshRevertHistory: () => Promise<void>;
}

const CLOSED: ConfirmState = {
  isOpen: false,
  title: "",
  message: "",
  variant: "danger",
  onConfirm: () => {},
};

/**
 * Confirmation flow for the four destructive actions in settings.
 *
 * Category deletion checks linked assets first, and space deletion previews the
 * cascade (subtree size + asset count) before opening the dialog, as required
 * by `SPECS.md` §4.1.
 */
export function useSettingsDelete({
  currentUserId,
  refreshActiveTabData,
  refreshRevertHistory,
}: UseSettingsDeleteParams) {
  const { showError, showSuccess } = UseToast();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>(CLOSED);

  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleDelete = useCallback(
    async (type: DeleteType, id?: string) => {
      if (type === "category" && id) {
        try {
          const checkRes = await fetch(`/api/categories/check-assets?id=${id}`);
          if (checkRes.ok) {
            const { hasAssets } = await checkRes.json();
            if (hasAssets) {
              showError(
                "Não é possível excluir esta categoria pois existem ativos vinculados a ela."
              );
              return;
            }
          }
        } catch {
          showError("Erro ao verificar dependências da categoria.");
          return;
        }
      }

      let spaceMessage: string | null = null;
      if (type === "space" && id) {
        try {
          const previewRes = await fetch(`/api/father-spaces/delete?id=${id}`);
          if (!previewRes.ok) {
            let message = "Não foi possível verificar o que será excluído.";
            try {
              const data = await previewRes.json();
              if (typeof data?.error === "string" && data.error) message = data.error;
            } catch {
              // Non-JSON body: keep the generic message.
            }
            showError(message);
            return;
          }

          const data = await previewRes.json();
          const actives = typeof data.actives === "number" ? data.actives : 0;
          const spaces = typeof data.spaces === "number" ? data.spaces : 1;
          spaceMessage = buildSpaceDeleteMessage(actives, spaces);
        } catch {
          showError("Erro de conexão ao verificar o tamanho da exclusão.");
          return;
        }
      }

      const dialogConfig: Record<
        DeleteType,
        { title: string; message: string; variant: "danger" }
      > = {
        user: {
          title: "Confirmar Exclusão de Usuário",
          message:
            "Tem certeza que deseja excluir este usuário? Esta ação é irreversível e o acesso será removido permanentemente.",
          variant: "danger",
        },
        space: {
          title: "Confirmar Exclusão de Espaço",
          message:
            spaceMessage ??
            "Tem certeza que deseja excluir este espaço pai? Todos os ativos associados serão excluídos permanentemente.",
          variant: "danger",
        },
        category: {
          title: "Confirmar Exclusão de Categoria",
          message: "Tem certeza que deseja excluir esta categoria? Esta ação é irreversível.",
          variant: "danger",
        },
        logs: {
          title: "Confirmar Limpeza de Logs",
          message: "Tem certeza que deseja limpar todos os logs do sistema? Esta ação é irreversível.",
          variant: "danger",
        },
      };

      const config = dialogConfig[type];

      setConfirmDialog({
        isOpen: true,
        title: config.title,
        message: config.message,
        variant: config.variant,
        onConfirm: async () => {
          try {
            let endpoint = "";
            if (type === "user") endpoint = `/api/users/${id}`;
            else if (type === "space") endpoint = `/api/father-spaces/delete?id=${id}`;
            else if (type === "category") endpoint = `/api/categories/delete?id=${id}`;
            else if (type === "logs") endpoint = "/api/logs/clear";

            const res = await fetch(endpoint, { method: "DELETE" });

            if (res.ok) {
              if (type === "user" && id === currentUserId) {
                window.location.href = "/login";
              } else {
                refreshActiveTabData();
              }
              showSuccess("Exclusão realizada com sucesso.");
              await refreshRevertHistory();
            } else {
              const errorData = await res.json();
              showError(errorData.error || "Erro ao realizar a exclusão.");
            }
          } catch {
            showError("Erro de conexão com o servidor ao tentar excluir.");
          } finally {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }
        },
      });
    },
    [currentUserId, refreshActiveTabData, refreshRevertHistory, showError, showSuccess]
  );

  return { confirmDialog, closeConfirm, handleDelete };
}
