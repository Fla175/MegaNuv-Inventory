// components/settings/CategoriesTab.tsx
import { Group, Pencil, Plus, Trash2 } from "lucide-react";
import type { SettingsCategory } from "@/components/settings/types";

interface CategoriesTabProps {
  categories: SettingsCategory[];
  onCreate: () => void;
  onEdit: (category: SettingsCategory) => void;
  onDelete: (id: string) => void;
}

export default function CategoriesTab({
  categories,
  onCreate,
  onEdit,
  onDelete,
}: CategoriesTabProps) {
  return (
    <div className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">
          Categorias
        </h3>
        {categories.length < 18 ? (
          <button
            onClick={onCreate}
            className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20"
          >
            <Plus size={24} />
          </button>
        ) : (
          <span className="text-[10px] font-black text-zinc-400 uppercase">Limite: 18</span>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
            <Group size={32} className="text-gray-400" />
          </div>
          <p className="text-lg font-black text-gray-400 uppercase italic">
            Nenhuma categoria cadastrada
          </p>
          <p className="text-xs font-bold text-gray-500 mt-1">
            Crie categorias para classificar seus ativos
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-zinc-50 dark:bg-zinc-950 p-3 lg:p-6 rounded-[2rem] border border-zinc-100 dark:border-white/5 flex flex-col items-center text-center group"
            >
              <div
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl mb-4 flex items-center justify-center text-white shadow-inner"
                style={{ backgroundColor: category.color || "#2563eb" }}
              >
                <Group size={18} className="lg:hidden" />
                <Group size={24} className="hidden lg:block" />
              </div>
              <h4 className="text-xs lg:text-sm font-black text-blue-950 dark:text-white uppercase italic">
                {category.name}
              </h4>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onEdit(category)}
                  className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-blue-600"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete(category.id)}
                  className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
