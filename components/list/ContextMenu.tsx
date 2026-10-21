// components/list/ContextMenu.tsx
import React from "react";
import { Eye, Pencil, Move, Copy, Printer, Trash2 } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

interface ContextMenuProps {
  x: number;
  y: number;
  item: InventoryItem;
  onClose: () => void;
  onView: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onMove: (item: InventoryItem) => void;
  onClone: (item: InventoryItem) => void;
  onPrint: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

interface ContextBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function ContextBtn({ icon, label, onClick, danger }: ContextBtnProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase transition-all ${
        danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          : "text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white"
      }`}
    >
      {icon} {label}
    </button>
  );
}

const ContextMenu = React.forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ x, y, item, onClose, onView, onEdit, onMove, onClone, onPrint, onDelete }, ref) => {
    return (
      <div
        ref={ref}
        className="fixed z-[600] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border dark:border-white/10 shadow-2xl rounded-[1.5rem] py-2 w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        style={{ top: y, left: x }}
      >
        <div className="px-4 py-2 border-b dark:border-white/5">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
            Ações do Item
          </p>
          <p className="text-[10px] font-black dark:text-white truncate uppercase">{item.name}</p>
        </div>
        <ContextBtn
          icon={<Eye size={16} />}
          label="Visualizar Detalhes"
          onClick={() => {
            onView(item);
            onClose();
          }}
        />
        <ContextBtn
          icon={<Pencil size={16} />}
          label="Editar Ativo"
          onClick={() => {
            onEdit(item);
            onClose();
          }}
        />
        <ContextBtn
          icon={<Move size={16} />}
          label="Mover para outro local"
          onClick={() => {
            onMove(item);
            onClose();
          }}
        />
        <ContextBtn
          icon={<Copy size={16} />}
          label="Clonar Ativo"
          onClick={() => {
            onClone(item);
            onClose();
          }}
        />
        <ContextBtn
          icon={<Printer size={16} />}
          label="Imprimir Etiqueta"
          onClick={() => {
            onPrint(item);
            onClose();
          }}
        />
        <div className="mt-1 pt-1 border-t dark:border-white/5">
          <ContextBtn
            icon={<Trash2 size={16} />}
            label="Remover Registro"
            danger
            onClick={() => {
              onDelete(item);
              onClose();
            }}
          />
        </div>
      </div>
    );
  }
);

ContextMenu.displayName = "ContextMenu";

export default ContextMenu;
