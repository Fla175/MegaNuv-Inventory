// components/dashboard/CategoryAssetsModal.tsx
import { X } from "lucide-react";

interface AssetItem {
  id: string;
  name: string;
  tag: string;
  isPhysicalSpace: boolean;
}

interface CategoryAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categoryColor: string | null;
  assets: AssetItem[];
}

export default function CategoryAssetsModal({
  isOpen,
  onClose,
  categoryName,
  categoryColor,
  assets,
}: CategoryAssetsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-md">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] border dark:border-white/10">
        <div className="p-8 border-b dark:border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl text-white shadow-lg`} style={{ backgroundColor: categoryColor || "#3b82f6" }}>
              <Tag size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic leading-none">{categoryName}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Total: {assets.length} Ativos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-3">
          {assets.length > 0 ? (
            assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-blue-500/20 group transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-blue-600">
                    {asset.isPhysicalSpace ? <Layers size={18} /> : <Box size={18} />}
                  </div>
                  <div>
                    <h4 className="font-black text-blue-950 dark:text-gray-200 text-sm uppercase">{asset.name}</h4>
                    <div className="flex items-center">
                      <div className={`rounded-full h-2 w-2 m-1 ${asset.tag === "IN-USE" ? "bg-amber-500" : "bg-emerald-500"}`}></div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Status Atual: <span className={`text-[10px] ${asset.tag === "IN-USE" ? "text-amber-400" : "text-emerald-400"}`}>{asset.tag === "IN-USE" ? "Em Uso" : "Em Estoque"}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState message="Nenhum ativo registrado nesta categoria" />
          )}
        </div>
      </div>
    </div>
  );
}

import { Tag, Layers, Box } from "lucide-react";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-full text-gray-300 dark:text-gray-700 mb-4">
        <Tag size={32} strokeWidth={1.5} />
      </div>
      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{message}</p>
    </div>
  );
}
