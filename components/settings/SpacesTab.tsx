// components/settings/SpacesTab.tsx
import { LayoutDashboard, Plus, Trash2 } from "lucide-react";
import type { SettingsSpace } from "@/components/settings/types";

interface SpacesTabProps {
  spaces: SettingsSpace[];
  onCreate: () => void;
  onEdit: (space: SettingsSpace) => void;
  onDelete: (id: string) => void;
}

export default function SpacesTab({ spaces, onCreate, onEdit, onDelete }: SpacesTabProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-8 md:p-12 border-gray-50 dark:border-white/5">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">
            Espaços Pai
          </h3>
          <button
            onClick={onCreate}
            className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {spaces.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
              <LayoutDashboard size={32} className="text-gray-400" />
            </div>
            <p className="text-lg font-black text-gray-400 uppercase italic">
              Nenhum espaço pai cadastrado
            </p>
            <p className="text-xs font-bold text-gray-500 mt-1">
              Crie um espaço pai para organizar seus ativos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="bg-zinc-50 dark:bg-zinc-950 p-3 lg:p-6 rounded-[2rem] border border-zinc-100 dark:border-white/5 flex flex-col justify-between group"
              >
                <div className="p-2 relative overflow-hidden group flex flex-col justify-between">
                  <div>
                    <div className="absolute top-0 right-2 p-2 text-blue-500/10 group-hover:scale-125 transition-transform duration-500">
                      <LayoutDashboard size={60} />
                    </div>
                    <h4 className="text-base lg:text-xl font-black text-blue-950 dark:text-white uppercase italic mt-1">
                      {space.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2 font-medium">
                      {space.notes || "Sem notas."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => onEdit(space)}
                    className="flex-1 bg-white dark:bg-zinc-800 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(space.id)}
                    className="px-4 bg-white dark:bg-zinc-800 rounded-xl text-zinc-400 hover:text-red-500 border border-zinc-200 dark:border-white/5 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
