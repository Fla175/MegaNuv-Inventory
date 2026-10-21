// lib/hooks/useUserCrud.ts
import { useCallback, useEffect, useState } from "react";
import { UseToast } from "@/lib/context/ToastContext";
import type { SettingsUser } from "@/components/settings/types";
import type { UserRole } from "@/types/inventory";

interface UseUserCrudParams {
  currentUserId?: string;
  refreshUsers: () => void;
  refreshRevertHistory: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/** Create/edit form state and the submit handler for `/api/users`. */
export function useUserCrud({
  currentUserId,
  refreshUsers,
  refreshRevertHistory,
  refreshUser,
}: UseUserCrudParams) {
  const { showError } = UseToast();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SettingsUser | null>(null);
  const [role, setRole] = useState<UserRole | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRole(selectedUser ? selectedUser.role : "");
    // Keeps the session (and the header) in sync with role/profile changes.
    void refreshUser();
  }, [selectedUser, refreshUser]);

  const openCreateUser = useCallback(() => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  }, []);

  const openEditUser = useCallback((user: SettingsUser) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  }, []);

  const closeUserModal = useCallback(() => setIsUserModalOpen(false), []);

  const handleUserSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);

      const data = Object.fromEntries(new FormData(event.currentTarget));
      const isEditingSelf = selectedUser?.id === currentUserId;
      const url = selectedUser ? `/api/users/${selectedUser.id}` : "/api/users";
      const method = selectedUser ? "PATCH" : "POST";

      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          let message = "Erro ao salvar usuário.";
          try {
            const body = await res.json();
            if (typeof body?.message === "string") message = body.message;
          } catch {
            // Non-JSON body (e.g. a proxy 502): keep the generic message.
          }
          showError(message);
          return;
        }

        setIsUserModalOpen(false);
        refreshUsers();
        if (isEditingSelf) await refreshUser();
        await refreshRevertHistory();
      } finally {
        setSaving(false);
      }
    },
    [selectedUser, currentUserId, refreshUsers, refreshUser, refreshRevertHistory, showError]
  );

  return {
    isUserModalOpen,
    selectedUser,
    role,
    setRole,
    saving,
    openCreateUser,
    openEditUser,
    closeUserModal,
    handleUserSubmit,
  };
}
