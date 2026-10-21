// lib/hooks/useSettingsData.ts
import { useCallback, useEffect, useState } from "react";
import { UseToast } from "@/lib/context/ToastContext";
import type {
  SettingsCategory,
  SettingsLog,
  SettingsSpace,
  SettingsTab,
  SettingsUser,
} from "@/components/settings/types";

interface UseSettingsDataParams {
  activeTab: SettingsTab;
  canManageAll: boolean;
  canManageUsers: boolean;
  canSeeLogs: boolean;
}

/**
 * Owns the five lists shown by settings and the fetch rules per tab.
 *
 * `fetchData` surfaces a non-2xx response instead of silently leaving the old
 * list in place (ADR-001, stage 2.4): an empty screen now means "no records",
 * not "the request failed".
 */
export function useSettingsData({
  activeTab,
  canManageAll,
  canManageUsers,
  canSeeLogs,
}: UseSettingsDataParams) {
  const { showError } = UseToast();
  const [usersList, setUsersList] = useState<SettingsUser[]>([]);
  const [spacesList, setSpacesList] = useState<SettingsSpace[]>([]);
  const [categoriesList, setCategoriesList] = useState<SettingsCategory[]>([]);
  const [logsList, setLogsList] = useState<SettingsLog[]>([]);

  const fetchData = useCallback(
    async <T,>(endpoint: string, setter: (data: T) => void) => {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) {
          let message = "Erro ao carregar dados.";
          try {
            const data = await res.json();
            if (typeof data?.error === "string" && data.error) message = data.error;
          } catch {
            // Non-JSON body (e.g. a proxy 502): keep the generic message.
          }
          showError(message);
          return;
        }
        setter(await res.json());
      } catch {
        showError("Erro de conexão ao carregar dados.");
      }
    },
    [showError]
  );

  const refreshUsers = useCallback(
    () => fetchData("/api/users", setUsersList),
    [fetchData]
  );
  const refreshSpaces = useCallback(
    () => fetchData("/api/father-spaces/list", setSpacesList),
    [fetchData]
  );
  const refreshCategories = useCallback(
    () => fetchData("/api/categories/list", setCategoriesList),
    [fetchData]
  );
  const refreshLogs = useCallback(
    () => fetchData("/api/logs/list", setLogsList),
    [fetchData]
  );

  const refreshActiveTabData = useCallback(() => {
    if (activeTab === "users") refreshUsers();
    if (activeTab === "spaces" && canManageAll) refreshSpaces();
    if (activeTab === "categories" && canManageUsers) refreshCategories();
    if (activeTab === "logs" && canSeeLogs) refreshLogs();
  }, [
    activeTab,
    canManageAll,
    canManageUsers,
    canSeeLogs,
    refreshUsers,
    refreshSpaces,
    refreshCategories,
    refreshLogs,
  ]);

  useEffect(() => {
    refreshActiveTabData();
  }, [refreshActiveTabData]);

  return {
    usersList,
    spacesList,
    categoriesList,
    logsList,
    refreshActiveTabData,
    refreshUsers,
    refreshSpaces,
    refreshCategories,
    refreshLogs,
  };
}
