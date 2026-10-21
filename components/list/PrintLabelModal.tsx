// components/list/PrintLabelModal.tsx
import { X, Printer } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";
import Image from "next/image";

interface PrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onPrint: (item: InventoryItem) => void;
}

export default function PrintLabelModal({ isOpen, onClose, item, onPrint }: PrintLabelModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md print:relative print:w-full print:h-auto print:bg-white print:z-[9999] print:p-0 print:backdrop-blur-none">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] border dark:border-white/10 overflow-hidden shadow-2xl p-6 print:w-full print:max-w-none print:border-none print:shadow-none print:rounded-none print:p-0" id="qrcode-print-container">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h3 className="font-black uppercase text-sm dark:text-white">Imprimir Etiqueta</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-red-500 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-700 print:border-2 print:border-black print:rounded-lg print:m-4 print:p-4 text-black" id="qrcode-print-label">
          <div className="bg-white p-3">
            <Image src={`${typeof window !== "undefined" ? window.location.origin : ""}/qrcode/view?id=${item.id}`} alt="QR Code" width={160} height={160} />
          </div>
          <div className="mt-4 text-center">
            <h4 className="font-black text-lg uppercase tracking-tight leading-tight max-w-[200px]">{item.name}</h4>
            <p className="text-[10px] font-mono text-zinc-400 mt-2 uppercase tracking-widest">ID: {item.id.slice(0, 8).toUpperCase()}</p>
            {item.serialNumber && <p className="text-[10px] font-mono text-zinc-500 mt-1">SN: {item.serialNumber}</p>}
            {item.sku && <p className="text-[10px] font-mono text-zinc-400 mt-1">SKU/EAN: {item.sku}</p>}
          </div>
        </div>

        <button onClick={() => onPrint(item)} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white p-3 rounded-xl font-bold uppercase text-xs flex justify-center items-center gap-2 print:hidden">
          <Printer size={20} /> Imprimir Etiqueta
        </button>
      </div>
    </div>
  );
}
