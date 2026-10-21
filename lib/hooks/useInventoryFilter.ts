// lib/hooks/useInventoryFilter.ts
import { useMemo, useState, useEffect } from "react";
import type { ListSectionFilters } from "@/lib/types";
import type { InventoryItem, FatherSpace } from "@/types/inventory";

interface FilteredData {
  spaces: FatherSpace[];
  actives: InventoryItem[];
  hasFilters: boolean;
}

interface UseInventoryFilterProps {
  filters: ListSectionFilters;
  actives: InventoryItem[];
  fatherSpaces: FatherSpace[];
}

export function useInventoryFilter({
  filters,
  actives,
  fatherSpaces,
}: UseInventoryFilterProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const filteredData = useMemo<FilteredData>(() => {
    const query = filters.query?.toLowerCase() || "";
    const category = filters.category || "";
    const manufacturer = filters.manufacturer?.toLowerCase() || "";
    const model = filters.model?.toLowerCase() || "";

    const hasFilters =
      query !== "" || category !== "" || manufacturer !== "" || model !== "";

    const matchesDirectly = (a: InventoryItem) => {
      const nameMatch =
        query === "" ||
        a.name?.toLowerCase().includes(query) ||
        a.serialNumber?.toLowerCase().includes(query) ||
        a.sku?.toLowerCase().includes(query);

      const categoryMatch =
        category === "" ||
        a.categoryId === category ||
        a.category?.name === category;
      const manufacturerMatch =
        manufacturer === "" ||
        a.manufacturer?.toLowerCase().includes(manufacturer);
      const modelMatch = model === "" || a.model?.toLowerCase().includes(model);
      return nameMatch && categoryMatch && manufacturerMatch && modelMatch;
    };

    const visibleActiveIds = new Set<string>();

    const addAllDescendants = (startParentId: string) => {
      const queue = [startParentId];
      while (queue.length > 0) {
        const currentId = queue.shift();
        const children = actives.filter((a) => a.parentId === currentId);

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
          const parent = actives.find((a) => a.id === currentParentId);
          currentParentId = parent?.parentId ?? null;
        }
      }
    });

    const filteredActives = actives.filter((a) => visibleActiveIds.has(a.id));

    const filteredSpaces = fatherSpaces.filter((space) => {
      const hasVisibleActives = filteredActives.some(
        (a) => a.fatherSpaceId === space.id
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
  }, [filters, actives, fatherSpaces]);

  useEffect(() => {
    if (filteredData.hasFilters) {
      const newExpanded: Record<string, boolean> = {};

      filteredData.actives.forEach((item) => {
        const hasMatchingChildren = filteredData.actives.some(
          (child) => child.parentId === item.id
        );

        if (hasMatchingChildren) {
          newExpanded[item.id] = true;
        }
      });

      setExpandedNodes(newExpanded);
    } else {
      setExpandedNodes({});
    }
  }, [filters, filteredData.hasFilters, filteredData.actives]);

  return {
    filteredData,
    expandedNodes,
    setExpandedNodes,
  };
}
