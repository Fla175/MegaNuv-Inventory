// components/HeaderSection.tsx
import { Box, PlusCircle } from "lucide-react";

interface HeaderSectionProps {
  onNewActive: () => void;
}

export default function HeaderSection({ onNewActive }: HeaderSectionProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5">
      <div className="flex items-center gap-5 w-full md:w-auto">
        <div className="bg-blue-600 p-4 rounded-xl md:rounded-2xl text-white shadow-lg"><Box size={28} /></div>
        <div>
          <h1 className="text-xl md:text-3xl font-black text-blue-950 dark:text-white italic leading-none">Gestão de Ativos</h1>
          <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Inventário MegaNuv</p>
        </div>
      </div>

      <button 
        onClick={onNewActive}
        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95"
      >
        <PlusCircle size={18} />
        Novo Ativo
      </button>
    </div>
  );
}