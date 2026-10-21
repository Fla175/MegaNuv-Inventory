// components/list/MoveTree.tsx
import { ChevronRight, MapPin } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

interface MoveTreeProps {
  parentId: string | null;
  spaceId: string;
  actives: InventoryItem[];
  excludedMoveIds: Set<string>;
  moveExpanded: Record<string, boolean>;
  onExpandToggle: (id: string) => void;
  onMoveSelect: (spaceId: string, parentId?: string) => void;
}

export default function MoveTree({
  parentId,
  spaceId,
  actives,
  excludedMoveIds,
  moveExpanded,
  onExpandToggle,
  onMoveSelect,
}: MoveTreeProps) {
  const children = actives.filter((a) => {
    if (excludedMoveIds.has(a.id)) return false;
    if (!a.isPhysicalSpace) return false;

    if (parentId === null) {
      return a.fatherSpaceId === spaceId && (!a.parentId || a.parentId === "");
    }
    return a.parentId === parentId;
  });

  if (children.length === 0) return null;

  return (
    <div className="space-y-1 w-full">
      {children.map((sub) => {
        const isExpanded = moveExpanded[sub.id];
        const hasSubSpaces = actives.some(
          (a) =>
            a.parentId === sub.id &&
            a.isPhysicalSpace &&
            !excludedMoveIds.has(a.id)
        );

        return (
          <div key={sub.id} className="w-full flex flex-col">
            <div className="flex items-center p-0.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group">
              <button
                onClick={() => onMoveSelect(spaceId, sub.id)}
                className="flex-1 flex items-center gap-3 p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-all text-left min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-black text-zinc-600 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 uppercase truncate w-full">{sub.name}</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Espaço Físico</span>
                </div>
              </button>

              {hasSubSpaces && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpandToggle(sub.id);
                  }}
                  className="p-3 mr-1 text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all shrink-0"
                >
                  <ChevronRight size={16} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="border-l dark:border-white/5 ml-5 pl-2 mt-1 space-y-1">
                <MoveTree parentId={sub.id} spaceId={spaceId} actives={actives} excludedMoveIds={excludedMoveIds} moveExpanded={moveExpanded} onExpandToggle={onExpandToggle} onMoveSelect={onMoveSelect} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
