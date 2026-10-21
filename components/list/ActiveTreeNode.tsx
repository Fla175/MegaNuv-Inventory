// components/list/ActiveTreeNode.tsx
import { Layers, Box, Hash, ChevronRight } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  parentId?: string | null;
  fatherSpaceId?: string | null;
  isPhysicalSpace?: boolean;
  tag?: string;
  categoryId?: string | null;
  category?: { name: string; color?: string };
  sku?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  fixedValue?: number;
  imageUrl?: string | null;
  fileUrl?: string | null;
  notes?: string | null;
  childCount?: number;
  subSpaceCount?: number;
  hasSubItems?: boolean;
}

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface ActiveTreeNodeProps {
  item: InventoryItem;
  spaceId: string;
  level: number;
  actives: InventoryItem[];
  categories: Category[];
  selectedItems: Set<string>;
  isViewer: boolean;
  onContextMenu: (e: React.MouseEvent, item: InventoryItem, isPhysicalSpace: boolean) => void;
  onItemClick: (item: InventoryItem, hasSubItems: boolean, childCount: number, subSpaceCount: number) => void;
  onToggleExpand: (id: string) => void;
  expandedNodes: Record<string, boolean>;
  handleLongPressStart: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  handleLongPressEnd: (e?: React.MouseEvent | React.TouchEvent) => void;
  handleCheckboxChange: (checked: boolean, id: string, isPhysicalSpace: boolean) => void;
  toggleSingleSelection: (id: string, checked: boolean) => void;
  isSelectionMode: boolean;
  longPressItem: string | null;
}

export default function ActiveTreeNode({
  item,
  spaceId,
  level,
  actives,
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
  toggleSingleSelection,
  isSelectionMode,
  longPressItem,
}: ActiveTreeNodeProps) {
  const isExpanded = expandedNodes[item.id];
  const hasSubItems = actives.some((a) => a.parentId === item.id);
  const categoryObj = categories.find((ar) => ar.id === item.categoryId);
  const isSelected = selectedItems.has(item.id);

  const getAllChildIds = (parentId: string): string[] => {
    const children = actives.filter((a) => a.parentId === parentId);
    let ids: string[] = [];
    children.forEach((child) => {
      ids.push(child.id);
      if (child.isPhysicalSpace) {
        ids = [...ids, ...getAllChildIds(child.id)];
      }
    });
    return ids;
  };

  const handleCheckboxChangeWrapper = (checked: boolean) => {
    const childIds = item.isPhysicalSpace ? getAllChildIds(item.id) : [];
    void childIds;
    handleCheckboxChange(checked, item.id, item.isPhysicalSpace ?? false);
  };

  const itemBg = getItemColors(item.isPhysicalSpace ?? false, hasSubItems).bg;
  const itemText = getItemColors(item.isPhysicalSpace ?? false, hasSubItems).text;
  const chevronClass = `text-gray-300 opacity-50 group-hover:opacity-100 group-hover:text-blue-500 group-hover:translate-x-1 transition-all ${isExpanded ? "rotate-90" : ""}`;

  const childCount = actives.filter((a) => a.parentId === item.id && !a.isPhysicalSpace).length;
  const subSpaceCount = actives.filter((a) => a.parentId === item.id && a.isPhysicalSpace).length;

  return (
    <div key={item.id} className={`animate-in slide-in-from-left-2 duration-300 ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
      <div
        onContextMenu={(e) => onContextMenu(e, item, item.isPhysicalSpace ?? false)}
        onClick={() => {
          if (isSelectionMode) {
            handleCheckboxChange(!isSelected, item.id, item.isPhysicalSpace ?? false);
          } else {
            onItemClick(item, hasSubItems, childCount, subSpaceCount);
          }
        }}
        onMouseDown={(e) => handleLongPressStart(e, item.id)}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={(e) => handleLongPressStart(e, item.id)}
        onTouchEnd={handleLongPressEnd}
        className={`group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer border-b last:border-0 dark:border-white/5 transition-all duration-300 ${isSelected ? "bg-blue-50/50 dark:bg-blue-900/10" : ""} ${longPressItem === item.id ? "bg-blue-100 dark:bg-blue-900/30 scale-[0.99]" : ""}`}
      >
        <div className="flex items-center gap-3">
          {isSelectionMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleCheckboxChangeWrapper(e.target.checked);
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
            className={`relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-transform ${hasSubItems || item.isPhysicalSpace ? "cursor-pointer hover:scale-105 active:scale-95 border-2 border-blue-500/30" : "border dark:border-white/10"} ${itemBg} ${itemText}`}
          >
            {item.isPhysicalSpace ? <Layers size={20} /> : <Box size={20} />}
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-800 dark:text-zinc-200 uppercase tracking-tight line-clamp-1">{item.name}</h4>
            <div className="flex items-center mt-0.5">
              {item.isPhysicalSpace && (
                <p className={`text-[9px] font-bold uppercase tracking-widest mr-2 ${itemText}`}>Espaço Físico</p>
              )}
              {categoryObj?.color && (
                <p className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border mr-0.5" style={{ color: categoryObj.color, backgroundColor: `${categoryObj.color}15`, borderColor: `${categoryObj.color}40` }}>
                  {categoryObj.name}
                </p>
              )}
              <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center">
                {item.sku && <span className="ml-1 flex"><Hash size={10} /> SKU/EAN: {item.sku}</span>}
                {item.serialNumber && <span className="ml-1 text-blue-400 flex">{item.sku ? "•" : <Hash size={10} />} SN: {item.serialNumber}</span>}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-4 text-right pr-2 ${!item.isPhysicalSpace && "mr-8"}`}>
            {!isViewer && (
              <div className="hidden sm:block">
                <p className="text-[9px] font-black text-emerald-500/80 uppercase">Valor</p>
                <p className="text-xs font-black dark:text-white tracking-tighter">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.fixedValue || 0)}</p>
              </div>
            )}
            {item.isPhysicalSpace && <ChevronRight size={16} className={chevronClass} />}
          </div>
        </div>
        {isExpanded && (
          <div className="border-l dark:border-white/5 ml-5 pl-2 mt-1 space-y-1">
            {actives
              .filter((a) => {
                if (level === 0) {
                  return !a.parentId || a.parentId === "";
                }
                return a.parentId === item.id;
              })
              .map((child) => (
                <ActiveTreeNode
                  key={child.id}
                  item={child}
                  spaceId={spaceId}
                  level={level + 1}
                  actives={actives}
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
                  toggleSingleSelection={toggleSingleSelection}
                  isSelectionMode={isSelectionMode}
                  longPressItem={longPressItem}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getItemColors(isPhysicalSpace: boolean, hasSubItems: boolean) {
  if (isPhysicalSpace) {
    return hasSubItems
      ? { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" }
      : { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" };
  }
  return hasSubItems
    ? { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" }
    : { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" };
}
