// components/list/ActiveTreeNode.tsx
import { Layers, Box, Hash, ChevronRight, Ghost } from "lucide-react";
import { getItemColors } from "@/lib/constants/colors";
import type { InventoryItem, Category } from "@/types/inventory";

interface ActiveTreeNodeProps {
  item: InventoryItem;
  actives: InventoryItem[];
  visibleActives: InventoryItem[];
  categories: Category[];
  selectedItems: Set<string>;
  isViewer: boolean;
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
  expandedNodes: Record<string, boolean>;
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
  isSelectionMode: boolean;
  longPressItem: string | null;
  /** Depth in the active tree; the root is 0. */
  level?: number;
}

export default function ActiveTreeNode({
  item,
  actives,
  visibleActives,
  categories,
  selectedItems,
  isViewer,
  onContextMenu,
  onItemClick,
  onToggleExpand,
  expandedNodes,
  handleLongPressStart,
  handleLongPressEnd,
  handleCheckboxChange,
  isSelectionMode,
  longPressItem,
  level = 0,
}: ActiveTreeNodeProps) {
  const isExpanded = expandedNodes[item.id];
  const childActives = actives.filter((a) => a.parentId === item.id);
  const visibleChildren = visibleActives.filter((a) => a.parentId === item.id);
  const hasSubItems = childActives.length > 0;
  const categoryObj = categories.find((ar) => ar.id === item.categoryId);
  const isSelected = selectedItems.has(item.id);

  const childCount = childActives.filter((a) => !a.isPhysicalSpace).length;
  const subSpaceCount = childActives.filter((a) => a.isPhysicalSpace).length;

  const itemColors = getItemColors(item.isPhysicalSpace ?? false, hasSubItems);
  const chevronClass = `text-gray-300 opacity-50 group-hover:opacity-100 group-hover:text-blue-500 group-hover:translate-x-1 transition-all ${
    isExpanded ? "rotate-90" : ""
  }`;

  return (
    <div
      className={`animate-in slide-in-from-left-2 duration-300 ${
        isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
    >
      <div
        onContextMenu={(e) =>
          onContextMenu(e, item, item.isPhysicalSpace ?? false)
        }
        onClick={() => {
          if (isSelectionMode) {
            handleCheckboxChange(
              !isSelected,
              item.id,
              item.isPhysicalSpace ?? false
            );
          } else {
            onItemClick(item, hasSubItems, childCount, subSpaceCount);
          }
        }}
        onMouseDown={(e) => handleLongPressStart(e, item.id)}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={(e) => handleLongPressStart(e, item.id)}
        onTouchEnd={handleLongPressEnd}
        className={`group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer border-b last:border-0 dark:border-white/5 transition-all duration-300 ${
          isSelected ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
        } ${
          longPressItem === item.id
            ? "bg-blue-100 dark:bg-blue-900/30 scale-[0.99]"
            : ""
        }`}
      >
        <div className="flex items-center gap-3">
          {isSelectionMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleCheckboxChange(
                  e.target.checked,
                  item.id,
                  item.isPhysicalSpace ?? false
                );
              }}
              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (hasSubItems || item.isPhysicalSpace) {
                onToggleExpand(item.id);
              } else {
                onItemClick(item, hasSubItems, childCount, subSpaceCount);
              }
            }}
            className={`relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-transform ${
              hasSubItems || item.isPhysicalSpace
                ? "cursor-pointer hover:scale-105 active:scale-95 border-2 border-blue-500/30"
                : "border dark:border-white/10"
            } ${itemColors.bg} ${itemColors.text}`}
          >
            {item.isPhysicalSpace ? <Layers size={20} /> : <Box size={20} />}
          </div>

          <div>
            <h4 className="text-sm font-black text-gray-800 dark:text-zinc-200 uppercase tracking-tight line-clamp-1">
              {item.name}
            </h4>
            <div className="flex items-center mt-0.5">
              {item.isPhysicalSpace && (
                <p
                  className={`text-[9px] font-bold uppercase tracking-widest mr-2 ${itemColors.text}`}
                >
                  Espaço Físico
                </p>
              )}

              {categoryObj?.color && (
                <p
                  className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border mr-0.5"
                  style={{
                    color: categoryObj.color,
                    backgroundColor: `${categoryObj.color}15`,
                    borderColor: `${categoryObj.color}40`,
                  }}
                >
                  {categoryObj.name}
                </p>
              )}

              <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center">
                {item.sku && (
                  <span className="ml-1 flex">
                    <Hash size={10} /> SKU/EAN: {item.sku}
                  </span>
                )}{" "}
                {item.serialNumber && (
                  <span className="ml-1 text-blue-400 flex">
                    {item.sku ? "•" : <Hash size={10} />} SN:{" "}
                    {item.serialNumber}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`flex items-center gap-4 text-right pr-2 ${
            !item.isPhysicalSpace && "mr-8"
          }`}
        >
          {!isViewer && (
            <div className="hidden sm:block">
              <p className="text-[9px] font-black text-emerald-500/80 uppercase">
                Valor
              </p>
              <p className="text-xs font-black dark:text-white tracking-tighter">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(item.fixedValue || 0)}
              </p>
            </div>
          )}
          {item.isPhysicalSpace && (
            <ChevronRight size={16} className={chevronClass} />
          )}
        </div>
      </div>

      {isExpanded &&
        (visibleChildren.length > 0 ? (
          <div
            className="border-l-2 dark:border-white/5 pl-4"
            style={{ marginLeft: `${(level + 1) * 1.5}rem` }}
          >
            {visibleChildren.map((child) => (
              <ActiveTreeNode
                key={child.id}
                item={child}
                actives={actives}
                visibleActives={visibleActives}
                categories={categories}
                selectedItems={selectedItems}
                isViewer={isViewer}
                onContextMenu={onContextMenu}
                onItemClick={onItemClick}
                onToggleExpand={onToggleExpand}
                expandedNodes={expandedNodes}
                handleLongPressStart={handleLongPressStart}
                handleLongPressEnd={handleLongPressEnd}
                handleCheckboxChange={handleCheckboxChange}
                isSelectionMode={isSelectionMode}
                longPressItem={longPressItem}
                level={level + 1}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-8 px-6 opacity-40 border-l-2 dark:border-white/5"
            style={{ marginLeft: `${(level + 1) * 2}rem` }}
          >
            <Ghost size={24} className="mb-2 text-zinc-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">
              Este espaço físico está vazio
            </p>
          </div>
        ))}
    </div>
  );
}
