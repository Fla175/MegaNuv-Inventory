// lib/hooks/useRevertHistory.ts
import { useCallback, useEffect, useState } from "react";
import { UseToast } from "@/lib/context/ToastContext";
import type { RevertItem } from "@/lib/revert/types";
import { buildRevertPayload, selectRevertItems } from "@/lib/settings/revert";

interface UseRevertHistoryParams {
  enabled: boolean;
  refreshActiveTabData: () => void;
  refreshUser: () => Promise<void>;
}

/**
 * Polls `/api/database/revert` every 5s and owns the History selection.
 *
 * The polling stays disabled until the session resolves, matching the old
 * guard `if (!user) return`.
 */
export function useRevertHistory({
  enabled,
  refreshActiveTabData,
  refreshUser,
}: UseRevertHistoryParams) {
  const { showError, showSuccess } = UseToast();
  const [revertItems, setRevertItems] = useState<RevertItem[]>([]);
  const [isRevertMenuOpen, setIsRevertMenuOpen] = useState(false);
  const [selectedReverts, setSelectedReverts] = useState<Set<string>>(new Set());
  const [isReverting, setIsReverting] = useState(false);

  const fetchRevertHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/database/revert");
      if (!res.ok) {
        setRevertItems([]);
        return;
      }
      const data = await res.json();
      setRevertItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setRevertItems([]);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchRevertHistory();
    const interval = window.setInterval(fetchRevertHistory, 5000);
    return () => window.clearInterval(interval);
  }, [enabled, fetchRevertHistory]);

  const toggleRevertItem = useCallback((id: string) => {
    setSelectedReverts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRevertSelected = useCallback(
    async (targetItems?: RevertItem[]) => {
      const selectedList =
        targetItems || selectRevertItems(revertItems, selectedReverts);

      if (selectedList.length === 0 || isReverting) return;

      setIsReverting(true);

      const payloadItems = buildRevertPayload(selectedList);

      try {
        const res = await fetch("/api/database/revert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: payloadItems,
            mode: "HISTORY",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          showError(data.error || "Não foi possível realizar a reversão.");
          return;
        }

        showSuccess(`${data.revertedCount || payloadItems.length} item(ns) revertido(s) em lote!`);
        setSelectedReverts(new Set());
        setIsRevertMenuOpen(false);

        await fetchRevertHistory();
        refreshActiveTabData();
        await refreshUser();
      } catch {
        showError("Erro ao processar as reversões.");
      } finally {
        setIsReverting(false);
      }
    },
    [
      revertItems,
      selectedReverts,
      isReverting,
      fetchRevertHistory,
      refreshActiveTabData,
      refreshUser,
      showError,
      showSuccess,
    ]
  );

  const handleQuickUndo = useCallback(async () => {
    if (revertItems.length === 0 || isReverting) return;
    await handleRevertSelected([revertItems[0]]);
  }, [revertItems, isReverting, handleRevertSelected]);

  return {
    revertItems,
    isRevertMenuOpen,
    setIsRevertMenuOpen,
    selectedReverts,
    isReverting,
    toggleRevertItem,
    handleRevertSelected,
    handleQuickUndo,
    fetchRevertHistory,
  };
}
