// __tests__/lib/inventory-filter.test.ts
import { describe, expect, it } from "vitest";
import { buildExpandedNodes, filterInventory } from "@/lib/inventory/filter";
import type { FatherSpace, InventoryItem } from "@/types/inventory";

const spaces = [
  { id: "space-a", name: "Escritório" },
  { id: "space-b", name: "Depósito" },
] as FatherSpace[];

const actives = [
  {
    id: "rack",
    name: "Rack Principal",
    fatherSpaceId: "space-a",
    isPhysicalSpace: true,
  },
  {
    id: "switch",
    name: "Switch 24p",
    parentId: "rack",
    fatherSpaceId: "space-a",
    manufacturer: "Cisco",
    model: "SG250",
    serialNumber: "SN-123",
    sku: "SW-24",
  },
  {
    id: "child-of-switch",
    name: "Módulo uplink",
    parentId: "switch",
    fatherSpaceId: "space-a",
  },
  {
    id: "printer",
    name: "Impressora",
    fatherSpaceId: "space-b",
    categoryId: "cat-1",
  },
] as InventoryItem[];

describe("filterInventory", () => {
  it("returns everything when no filter is active", () => {
    const result = filterInventory({ filters: {}, actives, fatherSpaces: spaces });

    expect(result.hasFilters).toBe(false);
    expect(result.actives).toHaveLength(actives.length);
    expect(result.spaces).toEqual(spaces);
  });

  it("matches name, serial number and sku, and keeps the parent chain", () => {
    const bySerial = filterInventory({
      filters: { query: "sn-123" },
      actives,
      fatherSpaces: spaces,
    });
    expect(bySerial.actives.map((item) => item.id)).toEqual(["rack", "switch"]);
    expect(bySerial.spaces.map((space) => space.id)).toEqual(["space-a"]);

    const bySku = filterInventory({
      filters: { query: "sw-24" },
      actives,
      fatherSpaces: spaces,
    });
    expect(bySku.actives.map((item) => item.id)).toEqual(["rack", "switch"]);
  });

  it("includes every descendant when a physical space matches", () => {
    const result = filterInventory({
      filters: { query: "rack principal" },
      actives,
      fatherSpaces: spaces,
    });

    expect(result.actives.map((item) => item.id)).toEqual([
      "rack",
      "switch",
      "child-of-switch",
    ]);
  });

  it("matches category by id or name", () => {
    const byId = filterInventory({
      filters: { category: "cat-1" },
      actives,
      fatherSpaces: spaces,
    });
    expect(byId.actives.map((item) => item.id)).toEqual(["printer"]);

    const byName = filterInventory({
      filters: { category: "Impressoras" },
      actives: [{ ...actives[3], category: { id: "cat-1", name: "Impressoras" } as never }],
      fatherSpaces: spaces,
    });
    expect(byName.actives.map((item) => item.id)).toEqual(["printer"]);
  });

  it("keeps a space whose name matches even without visible actives", () => {
    const result = filterInventory({
      filters: { query: "depósito" },
      actives,
      fatherSpaces: spaces,
    });

    expect(result.actives).toEqual([]);
    expect(result.spaces.map((space) => space.id)).toEqual(["space-b"]);
  });
});

describe("buildExpandedNodes", () => {
  it("expands only nodes that have visible children", () => {
    expect(buildExpandedNodes(actives)).toEqual({
      rack: true,
      switch: true,
    });
  });
});
