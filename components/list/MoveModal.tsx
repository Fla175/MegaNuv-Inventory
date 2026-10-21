// components/list/MoveModal.tsx
import { X, MapPin, ChevronRight } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";
import MoveTree from "./MoveTree";

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  fatherSpaces: { id: string; name: string }[];
  actives: InventoryItem[];
  excludedMoveIds: Set<string>;
  moveExpanded: Record<string, boolean>;
  isMovingLoading: boolean;
  onExpandToggle: (id: string) => void;
  onMoveSelect: (spaceId: string, parentId?: string) => void;
}

export default function MoveModal({
  isOpen,
  onClose,
  item,
  fatherSpaces,
  actives,
  excludedMoveIds,
  moveExpanded,
  isMovingLoading,
  onExpandToggle,
  onMoveSelect,
}: MoveModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] border dark:border-white/10 overflow-hidden shadow-2xl">
        {isMovingLoading && (
          <div className="absolute inset-0 z-[800] flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
        <div className="p-6 border-b dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-blue-500 tracking-widest">Mover Ativo</h3>
            <p className="text-sm font-bold dark:text-white">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl">
            <X />
          </button>
        </div>

        <div className="p-4 max-h-[50vh] overflow-y-auto space-y-3 custom-scrollbar">
          {fatherSpaces.map((space) => {
            const isExpanded = moveExpanded[space.id];
            const hasTopLevelActives = actives.some(
              (a) =>
                a.fatherSpaceId === space.id &&
                a.isPhysicalSpace &&
                (!a.parentId || a.parentId === "") &&
                !excludedMoveIds.has(a.id)
            );

            return (
              <div key={space.id} className="border dark:border-white/5 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-950/50">
                <div className="flex items-center p-1">
                  <button
                    onClick={() => onMoveSelect(space.id, undefined)}
                    className="flex-1 flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all group text-left"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase group-hover:text-blue-600 transition-colors">{space.name}</span>
                  </button>
                  {hasTopLevelActives && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExpandToggle(space.id);
                      }}
                      className="p-4 mr-1 text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                    >
                      <ChevronRight
                        size={16}
                        className={`transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {isExpanded && hasTopLevelActives && (
                  <div className="border-t dark:border-white/5 p-2 space-y-1 bg-white dark:bg-zinc-900 pl-4">
                    <MoveTree parentId={null} spaceId={space.id} actives={actives} excludedMoveIds={excludedMoveIds} moveExpanded={moveExpanded} onExpandToggle={onExpandToggle} onMoveSelect={onMoveSelect} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
