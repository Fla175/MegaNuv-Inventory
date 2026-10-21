// lib/hooks/useCreatorAccess.ts
import { useCallback, useState } from "react";
import { UseToast } from "@/lib/context/ToastContext";
import type { SettingsUser } from "@/components/settings/types";

/**
 * Creator-only actions: entering another account (password required) and
 * transferring the creator title. Both delegate authorization to the API.
 */
export function useCreatorAccess() {
  const { showError, showSuccess, showWarning } = UseToast();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetUser, setTransferTargetUser] = useState<SettingsUser | null>(null);
  const [transferConfirmInput, setTransferConfirmInput] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const [enterTargetUser, setEnterTargetUser] = useState<SettingsUser | null>(null);
  const [enterPassword, setEnterPassword] = useState("");
  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const openEnterModal = useCallback((target: SettingsUser) => {
    setEnterTargetUser(target);
    setEnterPassword("");
    setIsEnterModalOpen(true);
  }, []);

  const closeEnterModal = useCallback(() => {
    setIsEnterModalOpen(false);
    setEnterTargetUser(null);
    setEnterPassword("");
  }, []);

  const openTransferModal = useCallback((target: SettingsUser) => {
    setTransferTargetUser(target);
    setTransferConfirmInput("");
    setIsTransferModalOpen(true);
  }, []);

  const closeTransferModal = useCallback(() => {
    setIsTransferModalOpen(false);
    setTransferTargetUser(null);
    setTransferConfirmInput("");
  }, []);

  const handleEnterAccount = useCallback(
    async (targetUser: SettingsUser) => {
      if (isEntering) return;
      if (!enterPassword) {
        showWarning("Informe sua senha para entrar na conta.");
        return;
      }

      setIsEntering(true);
      try {
        const res = await fetch("/api/creator-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ targetUserId: targetUser.id, password: enterPassword }),
        });

        const data = await res.json();
        if (res.ok) {
          showSuccess("Acesso ativado. Redirecionando...");
          window.location.assign("/");
        } else if (res.status === 401) {
          showWarning(data.error || "Senha incorreta.");
          setEnterPassword("");
        } else if (res.status === 400) {
          showWarning(data.error || "Senha é obrigatória.");
          setEnterPassword("");
        } else if (res.status === 409) {
          showWarning(data.error || "Restaure sua conta antes de entrar em outra.");
        } else {
          showError(data.error || "Erro ao acessar conta.");
        }
      } catch {
        showError("Erro de conexão ao acessar conta.");
      } finally {
        setIsEntering(false);
      }
    },
    [enterPassword, isEntering, showError, showSuccess, showWarning]
  );

  const handleTransferCreator = useCallback(
    async (targetUser: SettingsUser) => {
      if (isTransferring) return;
      setIsTransferring(true);
      try {
        const res = await fetch("/api/creator-access", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ newCreatorId: targetUser.id }),
        });

        const data = await res.json();
        if (res.ok) {
          showSuccess("Título de criador transferido com sucesso.");
          closeTransferModal();
          window.location.assign("/settings");
        } else {
          showError(data.error || "Erro ao transferir título.");
        }
      } catch {
        showError("Erro de conexão ao transferir título.");
      } finally {
        setIsTransferring(false);
      }
    },
    [isTransferring, closeTransferModal, showError, showSuccess]
  );

  return {
    isTransferModalOpen,
    transferTargetUser,
    transferConfirmInput,
    setTransferConfirmInput,
    isTransferring,
    enterTargetUser,
    enterPassword,
    setEnterPassword,
    isEnterModalOpen,
    isEntering,
    openEnterModal,
    closeEnterModal,
    openTransferModal,
    closeTransferModal,
    handleEnterAccount,
    handleTransferCreator,
  };
}
