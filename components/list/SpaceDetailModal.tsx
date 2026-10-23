// components/list/SpaceDetailModal.tsx
import { FileText, MapPin, Pencil, Phone, User, X } from "lucide-react";
import Image from "next/image";
import { toLocalMediaUrl } from "@/lib/mediaUrl";
import { getParentSpaceColors } from "@/lib/constants/colors";
import type { SpaceDetail } from "@/types/inventory";

interface SpaceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: SpaceDetail | null;
  /** Role decision made by the page: only DIRECTOR/ADMIN see the edit action. */
  canEdit: boolean;
  onEdit?: (space: SpaceDetail) => void;
}

/**
 * Read-only preview of a father space (ADR-004).
 *
 * Mirrors `ItemDetailModal`: the list click opens the modal, `Esc`/X closes it,
 * and empty fields render a descriptive placeholder instead of breaking the
 * layout. Editing stays in `/settings`; this modal only exposes the entry point.
 */
export default function SpaceDetailModal({
  isOpen,
  onClose,
  space,
  canEdit,
  onEdit,
}: SpaceDetailModalProps) {
  if (!isOpen || !space) return null;

  const colors = getParentSpaceColors(true);
  const showEdit = canEdit && !!onEdit;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes do espaço ${space.name}`}
      className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md"
    >
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] border dark:border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`p-3 rounded-2xl shrink-0 ${colors.bg} ${colors.text}`}>
              <MapPin size={24} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Espaço Pai
              </h3>
              <p className="text-xl font-black dark:text-white uppercase tracking-tighter truncate">
                {space.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes do espaço"
            className="p-3 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all shrink-0"
          >
            <X />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
          <div className="w-full h-48 sm:h-64 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border dark:border-white/5 overflow-hidden flex items-center justify-center relative">
            {space.imageUrl ? (
              <Image
                src={toLocalMediaUrl(space.imageUrl)}
                alt={space.name}
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-zinc-300 dark:text-zinc-700">
                <MapPin size={48} className="mb-2 opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Sem Imagem
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem
              icon={<MapPin size={16} />}
              label="Endereço"
              value={space.address || "Não informado"}
            />
            <InfoItem
              icon={<User size={16} />}
              label="Responsável"
              value={space.responsible || "Não informado"}
            />
            <InfoItem
              icon={<Phone size={16} />}
              label="Telefone"
              value={space.phone || "Não informado"}
            />
            {space.parent?.name && (
              <InfoItem
                icon={<MapPin size={16} />}
                label="Espaço Superior"
                value={space.parent.name}
              />
            )}
          </div>

          <div className="pt-4 border-t dark:border-white/5">
            <div className="flex items-center gap-2 mb-3 text-gray-400 dark:text-zinc-500">
              <FileText size={14} />
              <h4 className="text-[10px] font-black uppercase tracking-widest">
                Notas
              </h4>
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {space.notes ? (
                space.notes
              ) : (
                <p className="italic text-zinc-400 dark:text-zinc-500 font-medium">
                  Nenhuma observação registrada para este espaço.
                </p>
              )}
            </div>
          </div>
        </div>

        {showEdit && (
          <div className="p-4 border-t dark:border-white/5 bg-white dark:bg-zinc-900 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(space)}
              className="w-full sm:w-auto px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors"
            >
              <Pencil size={16} /> Editar espaço
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 group w-full overflow-hidden">
      <div className="p-2 bg-zinc-100 dark:bg-white/5 rounded-lg text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
          {label}
        </p>
        <p
          title={value}
          className="text-sm font-bold dark:text-zinc-200 uppercase truncate"
        >
          {value}
        </p>
      </div>
    </div>
  );
}
