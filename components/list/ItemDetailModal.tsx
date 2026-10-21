// components/list/ItemDetailModal.tsx
import { X, Layers, Box, Barcode, Hash, MapPin, Factory, Cpu, Tag, Boxes, Printer, Pencil, Move, Copy, Trash2, FileText } from "lucide-react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { toLocalMediaUrl } from "@/lib/mediaUrl";
import { getItemColors } from "@/lib/constants/colors";
import { parseFileUrls } from "@/lib/mediaReferences";
import { getFileDetails } from "./FileDetails";
import type { InventoryItem, Category, FatherSpace } from "@/types/inventory";

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  actives: InventoryItem[];
  fatherSpaces: FatherSpace[];
  categories: Category[];
  isViewer: boolean;
  onEdit: (item: InventoryItem, mode: "view" | "edit") => void;
  onMove: (item: InventoryItem) => void;
  onClone: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onPrint: (item: InventoryItem) => void;
}

export default function ItemDetailModal({
  isOpen,
  onClose,
  item,
  actives,
  fatherSpaces,
  categories,
  isViewer,
  onEdit,
  onMove,
  onClone,
  onDelete,
  onPrint,
}: ItemDetailModalProps) {
  if (!isOpen || !item) return null;

  const getCategory = (categoryId: string | null | undefined) => {
    const foundCategory = categories.find((cat) => cat.id === categoryId);
    return foundCategory ? foundCategory.name : "Categoria não encontrada";
  };

  const filesArray = parseFileUrls(item.fileUrl || "");

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-[2.5rem] border dark:border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${getItemColors(item.isPhysicalSpace ?? false, item.hasSubItems ?? false).bg} ${getItemColors(item.isPhysicalSpace ?? false, item.hasSubItems ?? false).text}`}>
              {item.isPhysicalSpace ? <Layers size={24} /> : <Box size={24} />}
            </div>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{item.isPhysicalSpace ? "Espaço Físico" : "Ativo Cadastrado"}</h3>
              <p className="text-xl font-black dark:text-white uppercase tracking-tighter">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
            <X />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="w-full h-48 sm:h-64 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border dark:border-white/5 overflow-hidden flex items-center justify-center relative group">
              {item.imageUrl ? (
                <Image src={toLocalMediaUrl(item.imageUrl)} alt={item.name} fill className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="flex flex-col items-center text-zinc-300 dark:text-zinc-700">
                  <Box size={48} className="mb-2 opacity-50" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagem</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={<Barcode size={16} />} label="SKU/EAN" Class="font-mono truncate" value={item.sku || "N/A"} />
              <InfoItem icon={<Hash size={16} />} label="Nº Série" Class="font-mono truncate" value={item.serialNumber || "N/A"} />
              <InfoItem
                icon={<MapPin size={16} />}
                label="Localização"
                Class="truncate"
                value={
                  (item.parentId
                    ? actives.find((a) => a.id === item.parentId)?.name ||
                      item.fatherSpace?.name
                    : fatherSpaces.find((s) => s.id === item.fatherSpaceId)
                        ?.name) || "N/A"
                }
              />
              <InfoItem icon={<Barcode size={16} />} label="ID do Sistema" Class="font-mono text-[10px] truncate" value={item.id} />
              <InfoItem icon={<Factory size={16} />} label="Fabricante" Class="font-mono text-[10px] truncate" value={item.manufacturer || "Genérico"} />
              {item.model && <InfoItem icon={<Cpu size={16} />} label="Modelo" Class="font-mono text-[10px] truncate" value={item.model} />}
              <InfoItem icon={<Tag size={16} />} label="Categoria" Class="truncate" value={getCategory(item.categoryId)} />
              {(item.isPhysicalSpace || item.hasSubItems) && (
                <>
                  <InfoItem icon={<Boxes size={16} />} label="Ativos" Class="truncate" value={`${item.childCount || 0}`} />
                  <InfoItem icon={<Layers size={16} />} label="Espaços Físicos" Class="truncate" value={`${item.subSpaceCount || 0}`} />
                </>
              )}
            </div>

            <div className="pt-4 border-t dark:border-white/5">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Documentos & Anexos</h4>
              {filesArray.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filesArray.map((url: string, index: number) => {
                    const { displayName, extension, Icon, colorClass, bgClass } = getFileDetails(url);
                    return (
                      <a key={index} href={toLocalMediaUrl(url)} target="_blank" rel="noreferrer" className={`flex items-center gap-3 border rounded-xl p-3 transition-all hover:scale-[1.01] active:scale-[0.99] ${bgClass}`}>
                        <div className={`p-2 bg-white dark:bg-zinc-950 rounded-lg shadow-sm ${colorClass}`}><Icon size={18} /></div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate" title={displayName}>{displayName}</span>
                          {extension !== "link" && <span className={`text-[9px] font-black uppercase tracking-wider ${colorClass}`}>.{extension}</span>}
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 italic pl-1">Nenhum documento anexado a este ativo.</p>
              )}
            </div>
          </div>

          <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
            {item.isPhysicalSpace && (
              <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border dark:border-white/5">
                <div className="bg-white p-3 rounded-2xl shadow-md mb-4 border border-zinc-100">
                  <QRCode
                    value={`${
                      typeof window !== "undefined"
                        ? window.location.origin
                        : ""
                    }/qrcode/view?id=${item.id}`}
                    size={160}
                  />
                </div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter mb-4 text-center">QR Code</p>
                <button onClick={() => onPrint(item)} className="w-full py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors">
                  <Printer size={14} /> Imprimir Etiqueta
                </button>
              </div>
            )}
            <div className="flex flex-col p-5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border dark:border-white/5 flex-1 min-h-[160px]">
              <div className="flex items-center gap-2 mb-3 text-gray-400 dark:text-zinc-500">
                <FileText size={14} />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Notas</h4>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed overflow-y-auto custom-scrollbar flex-1 w-full whitespace-pre-wrap md:max-h-none">
                {item.notes ? (
                  item.notes
                ) : (
                  <p className="italic text-zinc-400 dark:text-zinc-500 font-medium pl-1">Nenhuma observação registrada para este ativo.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t dark:border-white/5 bg-white dark:bg-zinc-900 shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {!isViewer && (
            <button onClick={() => { onClose(); onEdit(item, "edit"); }} className="flex-1 sm:flex-none px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
              <Pencil size={16} /> <span className="hidden sm:inline">Editar</span>
            </button>
          )}
          <button onClick={() => { onClose(); onMove(item); }} className="flex-1 sm:flex-none px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
            <Move size={16} /> <span className="hidden sm:inline">Mover</span>
          </button>
          <button onClick={() => { onClose(); onClone(item); }} className="flex-1 sm:flex-none px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
            <Copy size={16} /> <span className="hidden sm:inline">Clonar</span>
          </button>
          <div className="hidden sm:block flex-1"></div>
          <button onClick={() => { onClose(); onDelete(item); }} className="flex-1 sm:flex-none px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
            <Trash2 size={16} /> <span className="hidden sm:inline">Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, Class, value }: { icon: React.ReactNode; label: string; Class: string; value: string }) {
  return (
    <div className="flex items-start gap-3 group w-full overflow-hidden">
      <div className="p-2 bg-zinc-100 dark:bg-white/5 rounded-lg text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-bold ${Class} dark:text-zinc-200 uppercase truncate`}>{value}</p>
      </div>
    </div>
  );
}
