// components/list/ActiveTree.tsx
import ActiveTreeNode from "./ActiveTreeNode";

interface InventoryItem {
  id: string;
  name: string;
  parentId?: string | null;
  fatherSpaceId?: string | null;
  isPhysicalSpace?: boolean;
}

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface ActiveTreeProps {
  parentId: string | null;
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

export default function ActiveTree({
  parentId,
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
}: ActiveTreeProps) {
  const children = actives.filter((a) => {
    const isTopLevel = !a.parentId || a.parentId === "";
    if (parentId === null) return isTopLevel && a.fatherSpaceId === spaceId;
    return a.parentId === parentId;
  });

  const hasChildren = children.length > 0;

  if (!hasChildren && level > 0) {
    const staticClasses = "border-l-2 dark:border-white/5";
    const dynamicMargin = `${level * 2}rem`;
    return (
      <div className={`flex flex-col items-center justify-center py-8 px-6 opacity-40 group-hover:opacity-60 transition-opacity ${staticClasses}`} style={{ marginLeft: dynamicMargin }}>
        <svg width={24} height={24} className="mb-2 text-zinc-400" />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">
          {level === 0 ? "Nenhum ativo neste local" : "Este espaço físico está vazio"}
        </p>
      </div>
    );
  }

  if (!hasChildren && level === 0) {
    return null;
  }

  const staticClasses = level > 0 ? "border-l-2 dark:border-white/5 pl-4" : "";
  const dynamicMargin = level > 0 ? `${level * 1.5}rem` : "0px";

  return (
    <div className={staticClasses} style={{ marginLeft: dynamicMargin }}>
      {children.map((child) => (
        <ActiveTreeNode
          key={child.id}
          item={child}
          spaceId={spaceId}
          level={level}
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
  );
}
