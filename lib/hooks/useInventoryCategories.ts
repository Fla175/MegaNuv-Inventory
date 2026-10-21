// lib/hooks/useInventoryCategories.ts
import { useEffect, useState } from "react";
import { UseToast } from "@/lib/context/ToastContext";
import type { Category } from "@/types/inventory";

/** Loads the categories shown next to the asset tree. */
export function useInventoryCategories() {
  const { showError } = UseToast();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories/list");
        if (!res.ok) {
          showError(`Erro ao carregar categorias (Status: ${res.status}).`);
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setCategories(data);
        }
      } catch (error) {
        showError(`Erro na rota de listagem de categorias: ${error}.`);
      }
    }

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [showError]);

  return categories;
}
