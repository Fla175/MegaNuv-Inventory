// components/dashboard/CategoriesGrid.tsx
import { Tag } from "lucide-react";

interface CategoryInfo {
  id: string;
  name: string;
  color: string;
}

interface CategoriesGridProps {
  categories: CategoryInfo[];
  assetsByCategory: Record<string, { id: string; name: string; isPhysicalSpace: boolean; tag: string }[]>;
  onSelectCategory: (categoryName: string) => void;
}

export default function CategoriesGrid({
  categories,
  assetsByCategory,
  onSelectCategory,
}: CategoriesGridProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <Tag size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-blue-950 dark:text-white italic uppercase leading-none">Categorias</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Classificação de Ativos</p>
          </div>
        </div>
        <div className="col-span-full py-10">
          <p className="text-center text-[10px] font-black text-gray-400 uppercase italic">Nenhuma categoria cadastrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
          <Tag size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-blue-950 dark:text-white italic uppercase leading-none">Categorias</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Classificação de Ativos</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((cat) => {
            const assets = assetsByCategory[cat.name] || [];
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className="flex flex-col items-center p-5 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-transparent hover:border-blue-500/30 transition-all group active:scale-95"
              >
                <div
                  className="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: cat.color || "#3b82f6" }}
                >
                  <Tag size={20} />
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center truncate w-full">{cat.name}</span>
                <span className="text-xl font-black text-blue-950 dark:text-white">{assets.length}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
