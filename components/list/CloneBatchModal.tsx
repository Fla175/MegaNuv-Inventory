// components/list/CloneBatchModal.tsx
import { X, Copy, Loader2 } from "lucide-react";

interface SearchableSelectOption {
  id: string;
  name: string;
  type: "default" | "space" | "active";
  parentId?: string | null;
}

interface CloneBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  cloneQuantity: number;
  setCloneQuantity: (q: number) => void;
  cloneDestinationSpaceId: string;
  setCloneDestinationSpaceId: (id: string) => void;
  isCloning: boolean;
  onClone: () => void;
  cloneLocationOptions: SearchableSelectOption[];
}

export default function CloneBatchModal({
  isOpen,
  onClose,
  selectedCount,
  cloneQuantity,
  setCloneQuantity,
  cloneDestinationSpaceId,
  setCloneDestinationSpaceId,
  isCloning,
  onClone,
  cloneLocationOptions,
}: CloneBatchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5">
        <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-xl"><Copy size={20} /></div>
            <div>
              <h3 className="text-sm font-black uppercase text-zinc-900 dark:text-white">Clonar Ativos</h3>
              <p className="text-[10px] text-zinc-400 font-medium">{selectedCount} ativo(s) selecionado(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="clone-quantity" className="block text-[10px] font-black uppercase text-zinc-400 mb-1.5">Quantidade de cópias por ativo</label>
            <input id="clone-quantity" type="number" min={1} max={50} value={cloneQuantity} onChange={(e) => setCloneQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            <span className="text-[12px] text-zinc-400 mt-1 block">Total a ser criado: <strong>{selectedCount * cloneQuantity} novos ativos</strong>.</span>
          </div>
          <div>
            <label htmlFor="clone-destination" className="block text-[10px] font-black uppercase text-zinc-400 mb-1.5">Localização</label>
            <select id="clone-destination" value={cloneDestinationSpaceId} onChange={(e) => setCloneDestinationSpaceId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Selecione o espaço de destino...</option>
              {cloneLocationOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-zinc-800">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase">Cancelar</button>
          <button type="button" disabled={isCloning} onClick={onClone} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50">
            {isCloning ? (<><Loader2 size={14} className="animate-spin" /> Clonando...</>) : (<><Copy size={14} /> Confirmar Clonagem</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
