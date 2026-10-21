// __tests__/lib/settings-helpers.test.ts
import { describe, expect, it } from "vitest";
import { canFetchTab } from "@/lib/settings/tabAccess";
import { buildRevertPayload, selectRevertItems } from "@/lib/settings/revert";
import { buildSpaceDeleteMessage } from "@/lib/settings/deletePreview";
import type { RevertItem } from "@/lib/revert/types";

describe("canFetchTab", () => {
  const all = { canManageAll: true, canManageUsers: true, canSeeLogs: true };
  const viewer = { canManageAll: false, canManageUsers: false, canSeeLogs: false };

  it("always fetches users, never theme", () => {
    expect(canFetchTab("users", viewer)).toBe(true);
    expect(canFetchTab("theme", all)).toBe(false);
  });

  it("gates spaces, categories and logs by permission", () => {
    expect(canFetchTab("spaces", all)).toBe(true);
    expect(canFetchTab("spaces", viewer)).toBe(false);
    expect(canFetchTab("categories", { ...viewer, canManageUsers: true })).toBe(true);
    expect(canFetchTab("logs", { ...viewer, canSeeLogs: true })).toBe(true);
  });
});

describe("revert helpers", () => {
  const individual: RevertItem = {
    id: "active-1",
    table: "Active",
    timestamp: "2026-10-21T10:00:00.000Z",
    name: "Rack",
    action: "UPDATE",
  };
  const batch: RevertItem = {
    groupId: "group-1",
    timestamp: "2026-10-21T10:05:00.000Z",
    name: "Lote",
    action: "MOVE",
    items: [
      { table: "Active", id: "active-2", timestamp: "2026-10-21T10:05:00.000Z" },
      { table: "Active", id: "active-3", timestamp: "2026-10-21T10:05:00.000Z" },
    ],
  };

  it("selects rows by groupId or id", () => {
    expect(selectRevertItems([individual, batch], new Set(["active-1"]))).toEqual([
      individual,
    ]);
    expect(selectRevertItems([individual, batch], new Set(["group-1"]))).toEqual([
      batch,
    ]);
  });

  it("flattens individual rows and batches into the POST payload", () => {
    expect(buildRevertPayload([individual, batch])).toEqual([
      { table: "Active", id: "active-1", timestamp: individual.timestamp },
      ...(batch.items as NonNullable<typeof batch.items>),
    ]);
  });
});

describe("buildSpaceDeleteMessage", () => {
  it("describes an empty space", () => {
    expect(buildSpaceDeleteMessage(0, 1)).toBe(
      "Tem certeza que deseja excluir este espaço pai? Nenhum ativo será excluído."
    );
  });

  it("uses singular for one asset", () => {
    expect(buildSpaceDeleteMessage(1, 1)).toBe(
      "Tem certeza que deseja excluir este espaço pai? 1 ativo será excluído permanentemente."
    );
  });

  it("counts child spaces and plural assets", () => {
    expect(buildSpaceDeleteMessage(2, 3)).toBe(
      "Tem certeza que deseja excluir este espaço pai e mais 2 espaço(s) filho(s)? 2 ativos serão excluídos permanentemente."
    );
  });
});
