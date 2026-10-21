// components/settings/RevertHistory.tsx
import { CheckCircle2, Loader2, Undo2, X } from "lucide-react";
import { ACTION_LABELS, type RevertItem } from "@/lib/revert/types";

interface RevertHistoryProps {
  revertItems: RevertItem[];
  selectedReverts: Set<string>;
  isRevertMenuOpen: boolean;
  isReverting: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onToggleItem: (id: string) => void;
  onQuickUndo: () => void;
  onRevertSelected: () => void;
}

export default function RevertHistory({
  revertItems,
  selectedReverts,
  isRevertMenuOpen,
  isReverting,
  onToggleMenu,
  onCloseMenu,
  onToggleItem,
  onQuickUndo,
  onRevertSelected,
}: RevertHistoryProps) {
  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        disabled={revertItems.length === 0 || isReverting}
        onClick={onQuickUndo}
        title="Desfazer última alteração"
        className="flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 border-blue-600 text-white hover:bg-blue-500"
      >
        {isReverting ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />}
        <span className="hidden sm:inline">Desfazer</span>
      </button>

      <button
        type="button"
        disabled={revertItems.length === 0}
        onClick={onToggleMenu}
        className="flex items-center gap-1.5 px-3 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all disabled:opacity-40 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-300 hover:text-blue-600"
      >
        Histórico
        {revertItems.length > 0 && (
          <span className="bg-blue-600 text-white min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[9px]">
            {revertItems.length}
          </span>
        )}
      </button>

      {isRevertMenuOpen && revertItems.length > 0 && (
        <div className="absolute right-0 top-full mt-2 z-[150] w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/5 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
            <div>
              <p className="text-xs font-black uppercase text-zinc-800 dark:text-white">
                Reverter alterações
              </p>
              <p className="text-[9px] text-zinc-400 font-bold mt-1">
                Selecione para reverter em lote.
              </p>
            </div>
            <button onClick={onCloseMenu} className="text-zinc-400 hover:text-red-500">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {revertItems.map((item) => {
              const itemKey = (item.groupId || item.id || item.timestamp) as string;
              const selected = selectedReverts.has(itemKey);

              return (
                <button
                  key={itemKey}
                  type="button"
                  onClick={() => onToggleItem(itemKey)}
                  className={`w-full flex items-center gap-3 p-3 text-left border-b border-zinc-100 dark:border-white/5 transition-colors ${
                    selected
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      selected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    {selected && <CheckCircle2 size={14} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black truncate text-zinc-800 dark:text-zinc-200">
                      {item.name}
                    </p>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase">
                      {item.items
                        ? ACTION_LABELS[item.action].batch
                        : ACTION_LABELS[item.action].single}{" "}
                      · {new Date(item.timestamp).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-950">
            <button
              type="button"
              disabled={selectedReverts.size === 0 || isReverting}
              onClick={onRevertSelected}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {isReverting ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
              Reverter selecionados ({selectedReverts.size})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
