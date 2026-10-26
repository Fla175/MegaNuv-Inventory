// components/list/InventorySpaces.tsx
import { Ghost, MapPin, SearchX } from "lucide-react";
import { getParentSpaceColors } from "@/lib/constants/colors";
import { isSpaceExpanded } from "@/lib/inventory/filter";
import ActiveTree from "./ActiveTree";
import type { Category, FatherSpace, InventoryItem } from "@/types/inventory";

interface InventorySpacesProps {
  spaces: FatherSpace[];
  actives: InventoryItem[];
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
  /** Collapses/expands the actives of a father space (map-pin toggle). */
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
        const spaceColors = getParentSpaceColors(hasActives); // usado no botão de expansão
        const isExpanded = isSpaceExpanded(expandedNodes, space.id);
        const bodyId = `space-actives-${space.id}`;

        // Entire card body opens the read-only detail modal.
        // The map-pin icon alone toggles expansion — no extra chevron.
        const openSpaceDetail = () => {
          if (!isSelectionMode) onSpaceClick(space);
        };

        return (
          <div
            key={space.id}
            className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header: name + map-pin toggle only */}
            <div className="p-6 flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-white/[0.02] border-b dark:border-white/5">
              <h2 className="text-xl font-black italic text-gray-500 dark:text-white uppercase truncate">
                {space.name}
              </h2>
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
                <MapPin
                  size={20}
                  className={`transition-transform ${isExpanded ? "" : "-rotate-90"} ${spaceColors.text}`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Card body: click opens detail; contextMenu is NOT exposed for father-space */}
            <div
              onClick={openSpaceDetail}
              onContextMenu={(e) => {
                // Original architecture gate: context menu only for actives / physical spaces,
                // not for father-spaces (the modal handles edits/inspection instead).
                if (!isSelectionMode) {
                  // Intentionally suppressed for father-space cards.
                  // The detail modal replaces menu actions for spaces.
                  e.preventDefault();
                }
              }}
              className={`bg-white dark:bg-zinc-900/50 ${isSelectionMode ? "cursor-default" : "cursor-pointer hover:bg-gray-50/30 dark:hover:bg-white/[0.01]"} transition-colors`}
            >
              {isExpanded && (
                <div id={bodyId} className="">
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
                    <div className="flex flex-col items-center justify-center py-8 px-6 opacity-40">
                      <Ghost size={24} className="mb-2 text-zinc-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">
                        Nenhum ativo neste local
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
