// lib/hooks/useInventoryFilter.ts
import { useMemo, useState, useEffect } from "react";
import type { ListSectionFilters } from "@/lib/types";
import type { InventoryItem, FatherSpace } from "@/types/inventory";
import { buildExpandedNodes, filterInventory } from "@/lib/inventory/filter";

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

  const filteredData = useMemo(
    () => filterInventory({ filters, actives, fatherSpaces }),
    [filters, actives, fatherSpaces]
  );

  useEffect(() => {
    setExpandedNodes(
      filteredData.hasFilters ? buildExpandedNodes(filteredData.actives) : {}
    );
  }, [filters, filteredData.hasFilters, filteredData.actives]);

  return {
    filteredData,
    expandedNodes,
    setExpandedNodes,
  };
}
