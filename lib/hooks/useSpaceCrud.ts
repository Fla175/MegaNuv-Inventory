// lib/hooks/useSpaceCrud.ts
import { useCallback, useState } from "react";
import type { SettingsSpace } from "@/components/settings/types";

interface UseSpaceCrudParams {
  refreshSpaces: () => void;
  refreshRevertHistory: () => Promise<void>;
}

/** Create/edit form state and submit handler for father spaces. */
export function useSpaceCrud({ refreshSpaces, refreshRevertHistory }: UseSpaceCrudParams) {
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<SettingsSpace | null>(null);
  const [spaceImageUrl, setSpaceImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreateSpace = useCallback(() => {
    setSelectedSpace(null);
    setSpaceImageUrl(null);
    setIsSpaceModalOpen(true);
  }, []);

  const openEditSpace = useCallback((space: SettingsSpace) => {
    setSelectedSpace(space);
    setSpaceImageUrl(null);
    setIsSpaceModalOpen(true);
  }, []);

  const closeSpaceModal = useCallback(() => setIsSpaceModalOpen(false), []);

  const handleSpaceSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);

      const formData = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = Object.fromEntries(formData);

      if (spaceImageUrl) payload.imageUrl = spaceImageUrl;
      if (selectedSpace) payload.id = selectedSpace.id;

      try {
        const res = await fetch(
          selectedSpace ? "/api/father-spaces/update" : "/api/father-spaces/create",
          {
            method: selectedSpace ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (res.ok) {
          setIsSpaceModalOpen(false);
          setSpaceImageUrl(null);
          refreshSpaces();
          await refreshRevertHistory();
        }
      } finally {
        setSaving(false);
      }
    },
    [spaceImageUrl, selectedSpace, refreshSpaces, refreshRevertHistory]
  );

  return {
    isSpaceModalOpen,
    selectedSpace,
    spaceImageUrl,
    setSpaceImageUrl,
    saving,
    openCreateSpace,
    openEditSpace,
    closeSpaceModal,
    handleSpaceSubmit,
  };
}
