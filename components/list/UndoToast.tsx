// components/list/UndoToast.tsx
import { Undo2, Loader2, CheckCircle2 } from "lucide-react";

interface UndoToastProps {
  undoData: {
    table: string;
    ids: string[];
    timestamp: string;
    name: string;
  } | null;
  undoSeconds: number;
  isUndoing: boolean;
  onUndo: () => void;
}

export default function UndoToast({
  undoData,
  undoSeconds,
  isUndoing,
  onUndo,
}: UndoToastProps) {
  if (!undoData || undoSeconds <= 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950/65 text-zinc-950 dark:text-white rounded-2xl shadow-2xl border border-white/10 dark:border-zinc-200/20 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="text-emerald-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-wide">
              Alteração realizada
            </p>
            <p className="text-[10px] opacity-60 truncate mt-0.5">
              {undoData.name}
            </p>
          </div>

          <button
            type="button"
            disabled={isUndoing}
            onClick={onUndo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            {isUndoing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Undo2 size={14} />
            )}
            Desfazer
          </button>
        </div>

        <div className="mt-3 h-1 bg-zinc-200 dark:bg-zinc-200/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-1000"
            style={{ width: `${(undoSeconds / 10) * 100}%` }}
          />
        </div>

        <p className="text-[9px] text-center opacity-40 font-bold mt-2">
          Disponível por mais {undoSeconds}s
        </p>
      </div>
    </div>
  );
}
