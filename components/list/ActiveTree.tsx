// components/list/ActiveTree.tsx
import ActiveTreeNode from "./ActiveTreeNode";
import type { InventoryItem, Category } from "@/types/inventory";

interface ActiveTreeProps {
  spaceId: string;
  /** Full collection — used for counts and "has children" decisions. */
  actives: InventoryItem[];
  /** Filtered collection — used to decide what is rendered. */
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
}

export default function ActiveTree({
  spaceId,
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
}: ActiveTreeProps) {
  const roots = visibleActives.filter((a) => {
    const isTopLevel = !a.parentId || a.parentId === "";
    return isTopLevel && a.fatherSpaceId === spaceId;
  });

  if (roots.length === 0) return null;

  return (
    <div>
      {roots.map((child) => (
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
        />
      ))}
    </div>
  );
}
