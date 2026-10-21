// components/ListSection.tsx
import type { ListSectionProps } from "@/lib/types";
import { useUser } from "@/lib/context/UserContext";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { UseToast } from "@/lib/context/ToastContext";
import { useInventorySelection } from "@/lib/hooks/useInventorySelection";
import { useInventoryFilter } from "@/lib/hooks/useInventoryFilter";
import { useMoveAction } from "@/lib/hooks/useMoveAction";
import { useUndo } from "@/lib/hooks/useUndo";
import { useCloneBatch } from "@/lib/hooks/useCloneBatch";
import UndoToast from "@/components/list/UndoToast";
import SelectionToolbar from "@/components/list/SelectionToolbar";
import ContextMenu from "@/components/list/ContextMenu";
import ItemDetailModal from "@/components/list/ItemDetailModal";
import PrintLabelModal from "@/components/list/PrintLabelModal";
import MoveModal from "@/components/list/MoveModal";
import CloneBatchModal from "@/components/list/CloneBatchModal";

export default function ListSection({
  filters,
  onEdit,
  onClone,
  onRefresh,
  actives,
  fatherSpaces,
}: ListSectionProps) {
  const { user } = useUser();
  const isMobile = useIsMobile();
  const toast = UseToast();
  void toast;
  const isViewer = user?.role === "VIEWER";

  const { isSelectionMode, selectedItems } = useInventorySelection({ actives });
  const { filteredData } = useInventoryFilter({ filters, actives, fatherSpaces });
  const { movingItem } = useMoveAction({ actives });
  const { undoData, undoSeconds, isUndoing } = useUndo({ onRefresh });
  const { isCloneBatchOpen } = useCloneBatch({ selectedItems, fatherSpaces, actives, onRefresh });

  void filters;
  void onEdit;
  void onClone;
  void onRefresh;
  void fatherSpaces;
  void isViewer;
  void isSelectionMode;
  void selectedItems;
  void movingItem;
  void undoData;
  void isCloneBatchOpen;

  return (
    <div>
      ListSection: {actives.length} ativos, filtered: {filteredData.actives.length}, selectionSize: {selectedItems.size}
      <UndoToast undoData={undoData} undoSeconds={undoSeconds} isUndoing={isUndoing} onUndo={() => {}} />
      <SelectionToolbar selectedCount={selectedItems.size} isMobile={isMobile} onMove={() => {}} onClone={() => {}} onDelete={() => {}} onCancel={() => {}} />
      <ContextMenu x={0} y={0} item={{ id: "test", name: "Test", isPhysicalSpace: false }} onClose={() => {}} onView={() => {}} onEdit={() => {}} onMove={() => {}} onClone={() => {}} onPrint={() => {}} onDelete={() => {}} />
      <ItemDetailModal isOpen={false} onClose={() => {}} item={{ id: "test", name: "Test", tag: "IN-STOCK", isPhysicalSpace: false, fixedValue: 0 }} actives={[]} fatherSpaces={[]} categories={[]} onEdit={() => {}} onMove={() => {}} onClone={() => {}} onDelete={() => {}} onPrint={() => {}} />
      <PrintLabelModal isOpen={false} onClose={() => {}} item={{ id: "test", name: "Test" }} onPrint={() => {}} />
      <MoveModal isOpen={false} onClose={() => {}} item={{ id: "test", name: "Test", isPhysicalSpace: false }} fatherSpaces={[]} actives={[]} excludedMoveIds={new Set()} moveExpanded={{}} isMovingLoading={false} onExpandToggle={() => {}} onMoveSelect={() => {}} />
      <CloneBatchModal isOpen={false} onClose={() => {}} selectedCount={0} cloneQuantity={1} setCloneQuantity={() => {}} cloneDestinationSpaceId="" setCloneDestinationSpaceId={() => {}} isCloning={false} onClone={() => {}} cloneLocationOptions={[]} />
    </div>
  );
}
