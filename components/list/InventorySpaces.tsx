// components/list/InventorySpaces.tsx
import { ChevronDown, Ghost, MapPin, SearchX } from "lucide-react";
import { getParentSpaceColors } from "@/lib/constants/colors";
import { isSpaceExpanded } from "@/lib/inventory/filter";
import ActiveTree from "./ActiveTree";
import type { Category, FatherSpace, InventoryItem } from "@/types/inventory";

interface InventorySpacesProps {
  spaces: FatherSpace[];
  /** Full collection — forwarded for counts. */
  actives: InventoryItem[];
  /** Filtered collection — decides which rows render. */
  visibleActives: InventoryItem[];
  categories: Category[];
  selectedItems: Set<string>;
  expandedNodes: Record<string, boolean>;
  isViewer: boolean;
  isSelectionMode: boolean;
  longPressItem: string | null;
  hasNoResultsFromFilter: boolean;
  onContextMenu: (
    e: React.MouseEvent,
    item: InventoryItem,
    isPhysicalSpace: boolean
  ) => void;
  onItemClick: (
    item: InventoryItem,
    hasSubItems: boolean,
    childCount: number,
    subSpaceCount: number
  ) => void;
  onToggleExpand: (id: string) => void;
  /** Opens the read-only detail modal for the clicked father space. */
  onSpaceClick: (space: FatherSpace) => void;
  /** Collapses/expands the actives of a father space. */
  onSpaceToggleExpand: (id: string) => void;
  handleLongPressStart: (
    e: React.MouseEvent | React.TouchEvent,
    id: string
  ) => void;
  handleLongPressEnd: (e?: React.MouseEvent | React.TouchEvent) => void;
  handleCheckboxChange: (
    checked: boolean,
    id: string,
    isPhysicalSpace: boolean
  ) => void;
}

export default function InventorySpaces({
  spaces,
  actives,
  visibleActives,
  categories,
  selectedItems,
  expandedNodes,
  isViewer,
  isSelectionMode,
  longPressItem,
  hasNoResultsFromFilter,
  onContextMenu,
  onItemClick,
  onToggleExpand,
  onSpaceClick,
  onSpaceToggleExpand,
  handleLongPressStart,
  handleLongPressEnd,
  handleCheckboxChange,
}: InventorySpacesProps) {
  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-gray-50/50 dark:bg-white/[0.01] rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/5 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500/40 blur-2xl rounded-full"></div>
          <div className="relative w-24 h-24 bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl flex items-center justify-center border dark:border-white/10">
            {hasNoResultsFromFilter ? (
              <SearchX size={40} className="text-red-400" />
            ) : (
              <MapPin size={40} className="text-blue-500" />
            )}
          </div>
        </div>
        <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase italic tracking-tight mb-2 text-center">
          {hasNoResultsFromFilter
            ? "Nenhum resultado encontrado"
            : "Nenhum Espaço Cadastrado"}
        </h3>
        <p className="text-[15px] font-bold text-gray-400 dark:text-zinc-500 text-center max-w-xs leading-relaxed">
          {hasNoResultsFromFilter
            ? "Tente ajustar seus termos de busca ou limpar os filtros aplicados."
            : "Para começar a organizar seu inventário, adicione primeiro um Espaço Pai."}
        </p>
      </div>
    );
  }

  return (
    <>
      {spaces.map((space) => {
        const hasActives = visibleActives.some(
          (a) => a.fatherSpaceId === space.id
        );
        const spaceColors = getParentSpaceColors(hasActives);
        const isExpanded = isSpaceExpanded(expandedNodes, space.id);
        const bodyId = `space-actives-${space.id}`;

        // The space itself is not a selection target: while the user is picking
        // actives, a header click must not open the details on top of the tree.
        const openDetails = () => {
          if (!isSelectionMode) onSpaceClick(space);
        };

        return (
          <div
            key={space.id}
            className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              onContextMenu={(e) => onContextMenu(e, space, true)}
              className="p-6 flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-white/[0.02] border-b dark:border-white/5"
            >
              <div
                role="button"
                tabIndex={isSelectionMode ? -1 : 0}
                aria-disabled={isSelectionMode}
                aria-label={`Ver detalhes do espaço ${space.name}`}
                onClick={openDetails}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openDetails();
                  }
                }}
                className={`flex items-center gap-4 min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isSelectionMode ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${spaceColors.bg} ${spaceColors.text}`}>
                  <MapPin size={20} />
                </div>
                <h2 className="text-xl font-black italic text-gray-500 dark:text-white uppercase truncate">
                  {space.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSpaceToggleExpand(space.id)}
                aria-expanded={isExpanded}
                aria-controls={bodyId}
                aria-label={
                  isExpanded
                    ? `Recolher ativos de ${space.name}`
                    : `Expandir ativos de ${space.name}`
                }
                title={isExpanded ? "Recolher ativos" : "Expandir ativos"}
                className="p-2 shrink-0 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronDown
                  size={20}
                  className={`transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                />
              </button>
            </div>
            {isExpanded && (
              <div
                id={bodyId}
                onContextMenu={(e) => onContextMenu(e, space, true)}
                className="bg-white dark:bg-zinc-900/50"
              >
                {hasActives ? (
                  <ActiveTree
                    spaceId={space.id}
                    actives={actives}
                    visibleActives={visibleActives}
                    categories={categories}
                    selectedItems={selectedItems}
                    expandedNodes={expandedNodes}
                    isViewer={isViewer}
                    isSelectionMode={isSelectionMode}
                    longPressItem={longPressItem}
                    onContextMenu={onContextMenu}
                    onItemClick={onItemClick}
                    onToggleExpand={onToggleExpand}
                    handleLongPressStart={handleLongPressStart}
                    handleLongPressEnd={handleLongPressEnd}
                    handleCheckboxChange={handleCheckboxChange}
                  />
                ) : (
                  <div
                    onClick={openDetails}
                    className={`flex flex-col items-center justify-center py-8 px-6 opacity-40 transition-opacity ${isSelectionMode ? "cursor-default" : "cursor-pointer hover:opacity-60"}`}
                  >
                    <Ghost size={24} className="mb-2 text-zinc-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">
                      Nenhum ativo neste local
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
