// lib/hooks/useDashboardStats.ts
import { useEffect, useState } from "react";

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
}

export interface ActiveItem {
  id: string;
  name: string;
  tag: string;
  category?: { name: string; color?: string };
  area?: { name: string; color?: string };
  updatedAt?: string;
  createdAt?: string;
  fromSpaceId?: string;
  toSpaceId?: string;
  isPhysicalSpace: boolean;
}

export interface DashboardStats {
  totalValue: number;
  totalActives: number;
  totalCategories: number;
  categories: CategoryInfo[];
  totalActivesQuantity: number;
  totalSpaces: number;
  fatherSpaces: number;
  PhysicalSpaces: number;
  recentActives: ActiveItem[];
  recentMovements?: ActiveItem[];
  assetsByCategory: Record<string, ActiveItem[]>;
}

/**
 * Busca e normaliza as estatísticas do dashboard.
 *
 * A API retorna `assetsByCategory` ou `assetsByArea` (legacy). Este hook
 * unifica em `assetsByCategory` e derivas `recentMovements` a partir de
 * `recentActives` quando o endpoint não enviar o campo dedicado.
 */
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Falha na API");
        const data = await res.json();

        const mappedCategories = data.assetsByCategory || data.assetsByArea || {};

        setStats({
          ...data,
          assetsByCategory: mappedCategories,
          recentMovements:
            data.recentMovements ||
            (data.recentActives ? data.recentActives.slice().reverse() : []),
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { stats, loading, error };
}
