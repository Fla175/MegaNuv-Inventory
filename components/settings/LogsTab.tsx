// components/settings/LogsTab.tsx
import { Activity, ClipboardList, Trash2 } from "lucide-react";
import type { SettingsLog } from "@/components/settings/types";

interface LogsTabProps {
  logs: SettingsLog[];
  canClear: boolean;
  onClear: () => void;
}

export default function LogsTab({ logs, canClear, onClear }: LogsTabProps) {
  return (
    <div className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">
          Logs
        </h3>
        {canClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline transition-all"
          >
            <Trash2 size={14} /> Limpar Tudo
          </button>
        )}
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
              <ClipboardList size={32} className="text-gray-400" />
            </div>
            <p className="text-lg font-black text-gray-400 uppercase italic">Nenhum log encontrado</p>
            <p className="text-xs font-bold text-gray-500 mt-1">
              As atividades serão registradas aqui
            </p>
          </div>
        ) : (
          [...logs]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((log) => (
              <div
                key={log.id}
                className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-white/5 flex items-start gap-4 text-[11px]"
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    log.action.includes("DELETE")
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <Activity size={14} />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <span className="font-black text-blue-950 dark:text-white uppercase italic">
                      {log.action}
                    </span>
                    <span className="text-zinc-400 font-bold">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-zinc-500 mt-1 font-bold">{log.details}</p>
                  <p className="text-[9px] font-black text-blue-600 uppercase mt-2">
                    Por: {log.user?.name || log.user?.email || "Usuário deletado"}
                  </p>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
