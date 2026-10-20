// pages/dashboard.tsx
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/context/UserContext";
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";
import { usePagination } from "@/lib/hooks/usePagination";
import KPICards from "@/components/dashboard/KPICards";
import CategoriesGrid from "@/components/dashboard/CategoriesGrid";
import RecentCreations from "@/components/dashboard/RecentCreations";
import RecentMovements from "@/components/dashboard/RecentMovements";
import StructureSummary from "@/components/dashboard/StructureSummary";
import CategoryAssetsModal from "@/components/dashboard/CategoryAssetsModal";

const ITEMS_PER_PAGE = 10;

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats();
  const { user } = useUser();

  // Hooks devem ser chamados ANTES de qualquer return condicional
  const creationsPagination = usePagination(stats?.recentActives || [], ITEMS_PER_PAGE);
  const movementsPagination = usePagination(stats?.recentMovements || [], ITEMS_PER_PAGE);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fecha o modal de categoria com Esc
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedCategory) {
        setSelectedCategory(null);
      }
    };
    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [selectedCategory]);

  if (loading) return (
    <Layout>
      <div className="flex h-[80vh] flex-col items-center justify-center text-blue-950 dark:text-blue-400 font-black animate-pulse">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <span className="tracking-[0.3em] text-xs uppercase">Sincronizando...</span>
      </div>
    </Layout>
  );

  if (error || !stats) return (
    <Layout>
      <div className="flex flex-col h-[80vh] items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black text-blue-950 dark:text-white italic uppercase">Sistemas Offline</h2>
        <button onClick={() => window.location.reload()} className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Reiniciar Conexão</button>
      </div>
    </Layout>
  );

  const isDirector = user?.role === "DIRECTOR";

  // Dados derivados para o modal de categoria
  const selectedCategoryObj = selectedCategory ? stats.categories?.find((c) => c.name === selectedCategory) : null;
  const selectedAssetsList = selectedCategory ? (stats.assetsByCategory[selectedCategory] || []) : [];

  return (
    <Layout title="Dashboard">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-10 transition-colors">
        {/* HEADER */}
        <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="bg-blue-600 p-4 rounded-xl md:rounded-2xl text-white shadow-lg"><LineChart size={28} /></div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-blue-950 dark:text-white italic leading-none">Dashboard</h1>
              <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Visão Geral do Patrimônio</p>
            </div>
          </div>
        </div>

        {/* CARDS KPI */}
        <div className={`${isDirector ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}`}>
          <KPICards totalValue={stats.totalValue} totalActives={stats.totalActives} />
        </div>

        {/* CATEGORIAS */}
        <CategoriesGrid
          categories={stats.categories || []}
          assetsByCategory={stats.assetsByCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* LISTAGENS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RecentCreations
            items={creationsPagination.paginated}
            page={creationsPagination.page}
            totalPages={creationsPagination.totalPages}
            onNextPage={creationsPagination.nextPage}
            onPrevPage={creationsPagination.prevPage}
          />
          <RecentMovements
            items={movementsPagination.paginated}
            page={movementsPagination.page}
            totalPages={movementsPagination.totalPages}
            onNextPage={movementsPagination.nextPage}
            onPrevPage={movementsPagination.prevPage}
          />
          <StructureSummary
            fatherSpaces={stats.fatherSpaces}
            PhysicalSpaces={stats.PhysicalSpaces}
            totalSpaces={stats.totalSpaces}
          />
        </div>
      </div>

      {/* MODAL DE ATIVOS POR CATEGORIA */}
      <CategoryAssetsModal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        categoryName={selectedCategory || ""}
        categoryColor={selectedCategoryObj?.color || null}
        assets={selectedAssetsList}
      />
    </Layout>
  );
}

import { Loader2, AlertCircle, LineChart } from "lucide-react";
