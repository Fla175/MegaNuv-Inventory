// lib/hooks/usePagination.ts
import { useState } from "react";

/**
 * Paginação genérica para listas de itens.
 *
 * Recebe a lista completa e o tamanho da página, e devolve o slice da página
 * atual, o total de páginas e funções para navegar.
 */
export function usePagination<T>(items: T[], itemsPerPage: number) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginated = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const nextPage = () =>
    setPage((p) => Math.min(totalPages, p + 1));
  const prevPage = () =>
    setPage((p) => Math.max(1, p - 1));
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));

  return {
    page,
    setPage,
    goToPage,
    nextPage,
    prevPage,
    paginated,
    totalPages,
    itemsPerPage,
  };
}
