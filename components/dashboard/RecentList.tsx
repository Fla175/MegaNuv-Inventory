// components/dashboard/RecentList.tsx
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";

interface ActiveItem {
  id: string;
  name: string;
  tag: string;
  fromSpaceId?: string;
  toSpaceId?: string;
}

interface RecentListProps {
  title: string;
  icon: React.ReactNode;
  items: ActiveItem[];
  page: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  emptyMessage: string;
}

export default function RecentList({
  title,
  icon,
  items,
  page,
  totalPages,
  onNextPage,
  onPrevPage,
  emptyMessage,
}: RecentListProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col h-full">
      <h3 className="text-lg font-black text-blue-950 dark:text-white flex items-center gap-3 italic mb-6">
        {icon} {title}
      </h3>
      <div className="space-y-3 flex-1">
        {items.length > 0 ? (
          items.map((ativo, idx) => (
            <div key={`${ativo.id}-${idx}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-blue-500 shadow-sm">
                  <Activity size={16} />
                </div>
                <div className="truncate">
                  <h4 className="font-black text-blue-950 dark:text-gray-200 text-xs uppercase truncate">{ativo.name}</h4>
                </div>
              </div>
              {ativo.fromSpaceId && (
                <span className="text-[10px] font-black italic px-2 py-1 text-gray-500 dark:text-gray-400">
                  De: {ativo.fromSpaceId} Para: {ativo.toSpaceId}
                </span>
              )}
              {!ativo.fromSpaceId && (
                <span className="text-[9px] font-black px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 rounded-lg">
                  {ativo.tag === "IN-USE" ? "Em Uso" : "Em Estoque"}
                </span>
              )}
            </div>
          ))
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
          <button
            onClick={onPrevPage}
            disabled={page === 1}
            className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[10px] font-black text-gray-400 uppercase">Pág {page}</span>
          <button
            onClick={onNextPage}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-full text-gray-300 dark:text-gray-700 mb-4">
        <Activity size={32} strokeWidth={1.5} />
      </div>
      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{message}</p>
    </div>
  );
}
