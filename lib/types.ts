// lib/types.ts
import type { FatherSpace, InventoryItem } from "@/types/inventory";

export interface ListSectionFilters {
  query?: string;
  category?: string;
  manufacturer?: string;
  model?: string;
}

export interface ListSectionProps {
  filters: ListSectionFilters;
  onEdit: (item: InventoryItem, mode: 'view' | 'edit') => void;
  onClone: (item: Partial<InventoryItem>) => void;
  onRefresh: () => void;
  onMove?: (item: InventoryItem) => void;
  actives: InventoryItem[];
  fatherSpaces: FatherSpace[];
  /**
   * Role decision made by the page. Passing it down keeps `ListSection` free of
   * `useUser()`, which is not resolvable while Next collects page data.
   */
  isViewer: boolean;
}
