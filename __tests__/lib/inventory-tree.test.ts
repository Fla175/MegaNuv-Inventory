// __tests__/lib/inventory-tree.test.ts
import { describe, expect, it } from "vitest";
import {
  collectActiveSubtreeIds,
  collectSelectionChildIds,
} from "@/lib/inventory/tree";

const actives = [
  { id: "asset-a", parentId: "space", isPhysicalSpace: false },
  { id: "asset-a-child", parentId: "asset-a", isPhysicalSpace: false },
  { id: "subspace", parentId: "space", isPhysicalSpace: true },
  { id: "asset-b", parentId: "subspace", isPhysicalSpace: false },
  { id: "asset-b-child", parentId: "asset-b", isPhysicalSpace: false },
];

describe("collectSelectionChildIds", () => {
  it("includes direct children and recurses only through physical spaces", () => {
    expect(collectSelectionChildIds(actives, "space")).toEqual([
      "asset-a",
      "subspace",
      "asset-b",
    ]);
  });

  it("returns an empty list for a leaf", () => {
    expect(collectSelectionChildIds(actives, "asset-a-child")).toEqual([]);
  });
});

describe("collectActiveSubtreeIds", () => {
  it("includes the root and every descendant, regardless of type", () => {
    expect([...collectActiveSubtreeIds(actives, "asset-a")]).toEqual([
      "asset-a",
      "asset-a-child",
    ]);
  });

  it("walks nested physical spaces and their assets", () => {
    expect([...collectActiveSubtreeIds(actives, "subspace")]).toEqual([
      "subspace",
      "asset-b",
      "asset-b-child",
    ]);
  });
});
