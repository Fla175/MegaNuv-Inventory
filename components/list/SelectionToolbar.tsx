// components/list/SelectionToolbar.tsx
import { Move, Copy, Trash2 } from "lucide-react";

interface SelectionToolbarProps {
  selectedCount: number;
  isMobile: boolean;
  onMove: () => void;
  onClone: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export default function SelectionToolbar({
  selectedCount,
  isMobile,
  onMove,
  onClone,
  onDelete,
  onCancel,
}: SelectionToolbarProps) {
  if (isMobile) {
    return (
      <div className="fixed z-[600] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border dark:border-white/10 shadow-2xl rounded-[1.5rem] py-2 w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="px-4 py-2 border-b dark:border-white/5">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">
            Seleção Múltipla
          </p>
          <p className="text-[10px] font-black dark:text-white">
            {selectedCount} ativo{selectedCount > 1 ? "s" : ""} selecionado{selectedCount > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onMove}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white"
        >
          <Move size={16} /> Mover Ativo{selectedCount > 1 && "s"}
        </button>
        <button
          onClick={onClone}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
        >
          <Copy size={16} /> Clonar Ativo{selectedCount > 1 && "s"}
        </button>
        <div className="mt-1 pt-1 border-t dark:border-white/5">
          <button
            onClick={onDelete}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <Trash2 size={16} /> Deletar Ativo{selectedCount > 1 && "s"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[500] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border-t dark:border-white/10 shadow-2xl p-4 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <p className="text-sm font-black text-gray-600 dark:text-zinc-400">
            <span className="text-blue-600 dark:text-blue-400">{selectedCount}</span>{" "}
            ativo{selectedCount > 1 ? "s" : ""} selecionado
            {selectedCount > 1 ? "s" : ""}
          </p>
          <button
            onClick={onCancel}
            className="text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
          >
            Cancelar
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClone}
            className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl font-black uppercase text-[10px] flex items-center gap-2"
          >
            <Copy size={16} /> Clonar em Lote
          </button>
          <button
            onClick={onMove}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl font-black uppercase text-[10px] flex items-center gap-2"
          >
            <Move size={16} /> Mover Ativos
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-black uppercase text-[10px] flex items-center gap-2"
          >
            <Trash2 size={16} /> Deletar Ativos
          </button>
        </div>
      </div>
    </div>
  );
}
