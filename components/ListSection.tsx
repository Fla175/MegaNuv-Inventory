// components/ListSection.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import type { ListSectionProps } from "@/lib/types";
import type { FatherSpace, InventoryItem, SpaceDetail } from "@/types/inventory";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { UseToast } from "@/lib/context/ToastContext";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";
import { useInventorySelection } from "@/lib/hooks/useInventorySelection";
import { useInventoryFilter } from "@/lib/hooks/useInventoryFilter";
import { useInventoryCategories } from "@/lib/hooks/useInventoryCategories";
import { useInventoryDelete } from "@/lib/hooks/useInventoryDelete";
import { useMoveAction } from "@/lib/hooks/useMoveAction";
import { useUndo } from "@/lib/hooks/useUndo";
import { useCloneBatch } from "@/lib/hooks/useCloneBatch";
import { toggleSpaceExpansion } from "@/lib/inventory/filter";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import InventorySpaces from "@/components/list/InventorySpaces";
import ContextMenu from "@/components/list/ContextMenu";
import ItemDetailModal from "@/components/list/ItemDetailModal";
import SpaceDetailModal from "@/components/list/SpaceDetailModal";
import PrintLabelModal from "@/components/list/PrintLabelModal";
import MoveModal from "@/components/list/MoveModal";
import CloneBatchModal from "@/components/list/CloneBatchModal";
import SelectionToolbar from "@/components/list/SelectionToolbar";
import UndoToast from "@/components/list/UndoToast";
import { executeIframePrint } from "@/components/list/executeIframePrint";

interface ContextMenuState {
  x: number;
  y: number;
  item: InventoryItem;
  isPhysicalSpace: boolean;
}

export default function ListSection({
  filters,
  onEdit,
  onClone,
  onRefresh,
  actives,
  fatherSpaces,
  isViewer,
  canEditSpace,
  onEditSpace,
}: ListSectionProps) {
  const isMobile = useIsMobile();
  const { showError } = UseToast();
  const menuRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectedPrintItem, setSelectedPrintItem] =
    useState<InventoryItem | null>(null);
  const [selectedViewItem, setSelectedViewItem] =
    useState<InventoryItem | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<SpaceDetail | null>(null);

  const { filteredData, expandedNodes, setExpandedNodes } = useInventoryFilter({
    filters,
    actives,
    fatherSpaces,
  });

  const {
    isSelectionMode,
    selectedItems,
    longPressItem,
    exitSelectionMode: clearSelection,
    handleLongPressStart,
    handleLongPressEnd,
    handleCheckboxChange,
  } = useInventorySelection({ actives });

  const categories = useInventoryCategories();
  const undo = useUndo({ onRefresh });

  const exitSelectionMode = useCallback(() => {
    clearSelection();
    setSelectedViewItem(null);
  }, [clearSelection]);

  const move = useMoveAction({
    actives,
    selectedItems,
    onRefresh,
    onExitSelectionMode: exitSelectionMode,
    showUndo: undo.showUndo,
    onMoved: () => setSelectedViewItem(null),
  });

  const clone = useCloneBatch({
    selectedItems,
    fatherSpaces,
    actives,
    onRefresh,
    onCloned: exitSelectionMode,
  });

  const deleteActions = useInventoryDelete({
    onRefresh,
    onDeleted: () => setSelectedViewItem(null),
    onBatchDeleted: exitSelectionMode,
  });

  const isBaseCompletelyEmpty = fatherSpaces.length === 0;
  const hasNoResultsFromFilter =
    fatherSpaces.length > 0 && filteredData.spaces.length === 0;

  useEscapeKey(() => setSelectedViewItem(null), !!selectedViewItem);
  useEscapeKey(() => setSelectedSpace(null), !!selectedSpace);
  useEscapeKey(() => setSelectedPrintItem(null), !!selectedPrintItem);
  useEscapeKey(() => move.setMovingItem(null), !!move.movingItem);
  useEscapeKey(() => setContextMenu(null), !!contextMenu);
  useEscapeKey(exitSelectionMode, isSelectionMode);

  // Diagnostic retained from the original screen: a viewer with an empty
  // payload may be looking at a backend permission failure, not an empty base.
  useEffect(() => {
    if (!isViewer || fatherSpaces.length > 0 || actives.length > 0) return;

    const testBackendPermissions = async () => {
      try {
        const [resSpaces, resActives] = await Promise.all([
          fetch("/api/father-spaces/list"),
          fetch("/api/actives/list"),
        ]);

        if (!resSpaces.ok || !resActives.ok) {
          showError(
            `Bloqueio detectado! A Listagem de espaços Pai retornou Status ${resSpaces.status} e a Listagem de Ativos retornou Status ${resActives.status}.`
          );
        }
      } catch {
        showError(
          "Falha crítica de comunicação com o servidor ao tentar validar as permissões."
        );
      }
    };

    testBackendPermissions();
  }, [isViewer, fatherSpaces, actives, showError]);

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const closeMenu = () => setContextMenu(null);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", closeMenu);
    window.addEventListener("resize", closeMenu);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", closeMenu);
      window.removeEventListener("resize", closeMenu);
    };
  }, [contextMenu]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: InventoryItem, isPhysicalSpace: boolean) => {
      e.preventDefault();
      e.stopPropagation();

      if (isMobile) return;
      if (isBaseCompletelyEmpty || hasNoResultsFromFilter) return;

      const menuWidth = 256;
      const menuHeight = 280;

      let x = e.clientX;
      let y = e.clientY;

      if (x + menuWidth > window.innerWidth) x = x - menuWidth;
      if (y + menuHeight > window.innerHeight) y = y - menuHeight;

      setContextMenu({ x, y, item, isPhysicalSpace });
    },
    [isMobile, isBaseCompletelyEmpty, hasNoResultsFromFilter]
  );

  const handleItemClick = (
    item: InventoryItem,
    hasSubItems: boolean,
    childCount: number,
    subSpaceCount: number
  ) => {
    setSelectedViewItem({ ...item, hasSubItems, childCount, subSpaceCount });
  };

  const handleToggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSpaceToggleExpand = (id: string) => {
    setExpandedNodes((prev) => toggleSpaceExpansion(prev, id));
  };

  const handleSpaceClick = useCallback(
    async (space: FatherSpace) => {
      try {
        const response = await fetch(`/api/father-spaces/${space.id}`);
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const detail = (await response.json()) as SpaceDetail;
        setSelectedSpace(detail);
      } catch {
        showError("Não foi possível carregar os detalhes do espaço.");
      }
    },
    [showError]
  );

  const handleItemLongPress = (
    e: React.MouseEvent | React.TouchEvent,
    id: string
  ) => {
    setContextMenu(null);
    handleLongPressStart(e, id);
  };

  const handleViewFromContextMenu = (item: InventoryItem) => {
    const children = actives.filter((a) => a.parentId === item.id);
    setSelectedViewItem({
      ...item,
      hasSubItems: children.length > 0,
      childCount: children.filter((a) => !a.isPhysicalSpace).length,
      subSpaceCount: children.filter((a) => a.isPhysicalSpace).length,
    });
  };

  const handleCloneClick = (item: InventoryItem) => {
    onClone({
      ...item,
      id: undefined,
      serialNumber: "",
      quantity: 1,
      fatherSpaceId: item.fatherSpaceId,
      parentId: item.parentId,
    });
    setSelectedViewItem(null);
  };

  const handleBatchMove = () => {
    if (selectedItems.size === 0) return;
    move.setMovingItem({
      id: Array.from(selectedItems)[0],
      name: `${selectedItems.size} ativos`,
      isBatch: true,
    });
  };

  return (
    <>
      <div className="w-full pb-32 print:hidden">
        <div className="space-y-6">
          <InventorySpaces
            spaces={filteredData.spaces}
            actives={actives}
            visibleActives={filteredData.actives}
            categories={categories}
            selectedItems={selectedItems}
            expandedNodes={expandedNodes}
            isViewer={isViewer}
            isSelectionMode={isSelectionMode}
            longPressItem={longPressItem}
            hasNoResultsFromFilter={hasNoResultsFromFilter}
            onContextMenu={handleContextMenu}
            onItemClick={handleItemClick}
            onToggleExpand={handleToggleExpand}
            onSpaceClick={handleSpaceClick}
            onSpaceToggleExpand={handleSpaceToggleExpand}
            handleLongPressStart={handleItemLongPress}
            handleLongPressEnd={handleLongPressEnd}
            handleCheckboxChange={handleCheckboxChange}
          />
        </div>
      </div>

      <ItemDetailModal
        isOpen={!!selectedViewItem}
        onClose={() => setSelectedViewItem(null)}
        item={selectedViewItem}
        actives={actives}
        fatherSpaces={fatherSpaces}
        categories={categories}
        onEdit={onEdit}
        onMove={(item) => move.setMovingItem(item)}
        onClone={handleCloneClick}
        onDelete={deleteActions.requestDelete}
        onPrint={(item) => {
          setSelectedViewItem(null);
          setSelectedPrintItem(item);
        }}
      />

      <SpaceDetailModal
        isOpen={!!selectedSpace}
        onClose={() => setSelectedSpace(null)}
        space={selectedSpace}
        canEdit={canEditSpace}
        onEdit={onEditSpace}
      />

      <PrintLabelModal
        isOpen={!!selectedPrintItem}
        onClose={() => setSelectedPrintItem(null)}
        item={selectedPrintItem}
        onPrint={executeIframePrint}
      />

      <MoveModal
        isOpen={!!move.movingItem}
        onClose={() => move.setMovingItem(null)}
        item={move.movingItem}
        fatherSpaces={fatherSpaces}
        actives={actives}
        excludedMoveIds={move.excludedMoveIds}
        moveExpanded={move.moveExpanded}
        isMovingLoading={move.isMovingLoading}
        onExpandToggle={(id) =>
          move.setMoveExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
        }
        onMoveSelect={move.handleMoveAction}
      />

      <CloneBatchModal
        isOpen={clone.isCloneBatchOpen}
        onClose={() => clone.setIsCloneBatchOpen(false)}
        selectedCount={selectedItems.size}
        cloneQuantity={clone.cloneQuantity}
        setCloneQuantity={clone.setCloneQuantity}
        cloneDestinationSpaceId={clone.cloneDestinationSpaceId}
        setCloneDestinationSpaceId={clone.setCloneDestinationSpaceId}
        isCloning={clone.isCloning}
        onClone={clone.handleBatchClone}
        cloneLocationOptions={clone.cloneLocationOptions}
      />

      {contextMenu && (
        <ContextMenu
          ref={menuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onView={handleViewFromContextMenu}
          onEdit={(item) => onEdit(item, "edit")}
          onMove={(item) => move.setMovingItem(item)}
          onClone={handleCloneClick}
          onPrint={(item) => setSelectedPrintItem(item)}
          onDelete={deleteActions.requestDelete}
        />
      )}

      {isSelectionMode && selectedItems.size > 0 && (
        <SelectionToolbar
          selectedCount={selectedItems.size}
          isMobile={isMobile}
          onMove={handleBatchMove}
          onClone={() => clone.setIsCloneBatchOpen(true)}
          onDelete={() =>
            deleteActions.requestBatchDelete(Array.from(selectedItems))
          }
          onCancel={exitSelectionMode}
        />
      )}

      <UndoToast
        undoData={undo.undoData}
        undoSeconds={undo.undoSeconds}
        isUndoing={undo.isUndoing}
        onUndo={undo.handleUndo}
      />

      <ConfirmDialog
        isOpen={deleteActions.confirmDialog.isOpen}
        title={deleteActions.confirmDialog.title}
        message={deleteActions.confirmDialog.message}
        variant={deleteActions.confirmDialog.variant}
        confirmLabel="Excluir"
        cancelLabel="Manter"
        onConfirm={deleteActions.confirmDialog.onConfirm}
        onCancel={deleteActions.closeConfirm}
      />
    </>
  );
}
