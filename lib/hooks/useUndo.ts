// lib/hooks/useUndo.ts
import { useState, useCallback, useEffect } from "react";
import { UseToast } from "@/lib/context/ToastContext";

export interface UndoData {
  table: string;
  ids: string[];
  timestamp: string;
  name: string;
}

interface UseUndoProps {
  onRefresh: () => void;
}

/**
 * Gerencia o popup de desfazer (undo) com contagem regressiva de 10s.
 *
 * O único trigger é uma movimentação (move.ts é o único endpoint que retorna
 * `timestamp`). Delete e clone não geram undo — eles vão pelo History em Settings.
 */
export function useUndo({ onRefresh }: UseUndoProps) {
  const { showError, showSuccess } = UseToast();
  const [undoData, setUndoData] = useState<UndoData | null>(null);
  const [undoSeconds, setUndoSeconds] = useState(0);
  const [isUndoing, setIsUndoing] = useState(false);

  const showUndo = useCallback(
    (id: string, name: string, timestamp: string, ids: string[]) => {
      setUndoData({ table: "Active", ids, name, timestamp });
      setUndoSeconds(10);
    },
    []
  );

  // Contagem regressiva de 10s
  useEffect(() => {
    if (!undoData) return;

    setUndoSeconds(10);

    const interval = window.setInterval(() => {
      setUndoSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setUndoData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [undoData]);

  const handleUndo = useCallback(async () => {
    if (!undoData || isUndoing) return;

    setIsUndoing(true);

    try {
      let successCount = 0;

      for (const id of undoData.ids) {
        const res = await fetch("/api/database/revert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table: undoData.table,
            id,
            timestamp: undoData.timestamp,
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          const data = await res.json();
          console.error(`Erro ao reverter ${id}:`, data);
        }
      }

      if (successCount === 0) {
        showError("Nenhuma alteração pôde ser revertida.");
        return;
      }

      if (successCount < undoData.ids.length) {
        showError(
          `${successCount} de ${undoData.ids.length} alterações foram revertidas.`
        );
      } else {
        showSuccess(
          successCount === 1
            ? "Alteração revertida com sucesso."
            : `${successCount} alterações revertidas com sucesso.`
        );
      }

      setUndoData(null);
      setUndoSeconds(0);
      onRefresh();
    } catch (error) {
      console.error("Erro no undo:", error);
      showError("Erro de conexão ao tentar reverter.");
    } finally {
      setIsUndoing(false);
    }
  }, [undoData, isUndoing, onRefresh, showError, showSuccess]);

  return {
    undoData,
    undoSeconds,
    isUndoing,
    showUndo,
    handleUndo,
  };
}
