// lib/hooks/useCategoryCrud.ts
import { useCallback, useState } from "react";
import { UseToast } from "@/lib/context/ToastContext";
import type { SettingsCategory } from "@/components/settings/types";

interface UseCategoryCrudParams {
  refreshCategories: () => void;
  refreshRevertHistory: () => Promise<void>;
}

/** Create/edit form state and submit handler for categories. */
export function useCategoryCrud({
  refreshCategories,
  refreshRevertHistory,
}: UseCategoryCrudParams) {
  const { showError, showSuccess } = UseToast();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreateCategory = useCallback(() => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  }, []);

  const openEditCategory = useCallback((category: SettingsCategory) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  }, []);

  const closeCategoryModal = useCallback(() => setIsCategoryModalOpen(false), []);

  const handleCategorySubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);

      const formData = new FormData(event.currentTarget);
      const name = formData.get("name") as string;
      const payload: { name: string; id?: string } = { name };
      if (selectedCategory) payload.id = selectedCategory.id;

      try {
        const res = await fetch(
          selectedCategory ? "/api/categories/update" : "/api/categories/create",
          {
            method: selectedCategory ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (res.ok) {
          setIsCategoryModalOpen(false);
          refreshCategories();
          showSuccess("Categoria salva com sucesso!");
          await refreshRevertHistory();
        } else {
          const errorData = await res.json();
          showError(errorData.error || "Erro ao salvar: este nome pode já estar em uso.");
        }
      } catch {
        showError("Erro de conexão com o servidor ao salvar categoria.");
      } finally {
        setSaving(false);
      }
    },
    [selectedCategory, refreshCategories, refreshRevertHistory, showError, showSuccess]
  );

  return {
    isCategoryModalOpen,
    selectedCategory,
    saving,
    openCreateCategory,
    openEditCategory,
    closeCategoryModal,
    handleCategorySubmit,
  };
}
