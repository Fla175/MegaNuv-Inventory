// lib/inventory/filter.ts
//
// Pure filtering rules for the inventory list. Extracted from
// `useInventoryFilter` so the query/category/manufacturer/model matching and
// the parent/descendant expansion can be tested without React.

import type { ListSectionFilters } from "@/lib/types";
import type { FatherSpace, InventoryItem } from "@/types/inventory";

export interface FilteredInventory {
  spaces: FatherSpace[];
  actives: InventoryItem[];
  hasFilters: boolean;
}

export interface InventoryFilterInput {
  filters: ListSectionFilters;
  actives: InventoryItem[];
  fatherSpaces: FatherSpace[];
}

export function filterInventory({
  filters,
  actives,
  fatherSpaces,
}: InventoryFilterInput): FilteredInventory {
  const query = filters.query?.toLowerCase() || "";
  const category = filters.category || "";
  const manufacturer = filters.manufacturer?.toLowerCase() || "";
  const model = filters.model?.toLowerCase() || "";

  const hasFilters =
    query !== "" || category !== "" || manufacturer !== "" || model !== "";

  const matchesDirectly = (active: InventoryItem) => {
    const nameMatch =
      query === "" ||
      active.name?.toLowerCase().includes(query) ||
      active.serialNumber?.toLowerCase().includes(query) ||
      active.sku?.toLowerCase().includes(query);

    const categoryMatch =
      category === "" ||
      active.categoryId === category ||
      active.category?.name === category;
    const manufacturerMatch =
      manufacturer === "" ||
      active.manufacturer?.toLowerCase().includes(manufacturer);
    const modelMatch =
      model === "" || active.model?.toLowerCase().includes(model);
    return nameMatch && categoryMatch && manufacturerMatch && modelMatch;
  };

  const visibleActiveIds = new Set<string>();

  const addAllDescendants = (startParentId: string) => {
    const queue = [startParentId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = actives.filter((active) => active.parentId === currentId);

      children.forEach((child) => {
        if (!visibleActiveIds.has(child.id)) {
          visibleActiveIds.add(child.id);
          queue.push(child.id);
        }
      });
    }
  };

  actives.forEach((active) => {
    if (matchesDirectly(active)) {
      visibleActiveIds.add(active.id);

      if (active.isPhysicalSpace) {
        addAllDescendants(active.id);
      }

      let currentParentId = active.parentId;
      while (currentParentId) {
        visibleActiveIds.add(currentParentId);
        const parent = actives.find((candidate) => candidate.id === currentParentId);
        currentParentId = parent?.parentId ?? null;
      }
    }
  });

  const filteredActives = actives.filter((active) => visibleActiveIds.has(active.id));

  const filteredSpaces = fatherSpaces.filter((space) => {
    const hasVisibleActives = filteredActives.some(
      (active) => active.fatherSpaceId === space.id
    );
    if (hasFilters) {
      const spaceNameMatch =
        query !== "" && space.name?.toLowerCase().includes(query);
      return hasVisibleActives || spaceNameMatch;
    }
    return true;
  });

  return {
    spaces: filteredSpaces,
    actives: filteredActives,
    hasFilters,
  };
}

/** Every node with at least one visible child starts expanded. */
export function buildExpandedNodes(
  actives: InventoryItem[]
): Record<string, boolean> {
  const expanded: Record<string, boolean> = {};

  actives.forEach((item) => {
    const hasMatchingChildren = actives.some((child) => child.parentId === item.id);
    if (hasMatchingChildren) expanded[item.id] = true;
  });

  return expanded;
}
