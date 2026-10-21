// __tests__/lib/settings-role-options.test.ts
import { describe, expect, it } from "vitest";
import { buildRoleOptions } from "@/lib/settings/roleOptions";

describe("buildRoleOptions", () => {
  it("offers nothing to VISITOR and VIEWER", () => {
    expect(buildRoleOptions(null, { directorExists: false })).toEqual([]);
    expect(buildRoleOptions({ role: "VIEWER" }, { directorExists: false })).toEqual([]);
  });

  it("offers only VIEWER to MANAGER, even when MANAGER is the creator", () => {
    const expected = [
      { value: "VIEWER", label: "Visualizador", indicatorColor: "bg-blue-500" },
    ];

    expect(buildRoleOptions({ role: "MANAGER" }, { directorExists: false })).toEqual(expected);
    expect(
      buildRoleOptions({ role: "MANAGER", isCreator: true }, { directorExists: false })
    ).toEqual(expected);
  });

  it("offers VIEWER, MANAGER and ADMIN to ADMIN and DIRECTOR", () => {
    const expected = [
      { value: "VIEWER", label: "Visualizador", indicatorColor: "bg-blue-500" },
      { value: "MANAGER", label: "Gerente", indicatorColor: "bg-amber-500" },
      { value: "ADMIN", label: "Administrador", indicatorColor: "bg-indigo-500" },
    ];

    expect(buildRoleOptions({ role: "ADMIN" }, { directorExists: false })).toEqual(expected);
    expect(buildRoleOptions({ role: "DIRECTOR" }, { directorExists: true })).toEqual(expected);
  });

  it("offers DIRECTOR only to the creator, and only while no DIRECTOR exists", () => {
    const creator = buildRoleOptions(
      { role: "ADMIN", isCreator: true },
      { directorExists: false }
    );

    expect(creator.map((option) => option.value)).toContain("DIRECTOR");
    expect(
      buildRoleOptions({ role: "ADMIN", isCreator: true }, { directorExists: true }).map(
        (option) => option.value
      )
    ).not.toContain("DIRECTOR");
    expect(
      buildRoleOptions({ role: "ADMIN", isCreator: false }, { directorExists: false }).map(
        (option) => option.value
      )
    ).not.toContain("DIRECTOR");
    expect(
      buildRoleOptions({ role: "VIEWER", isCreator: true }, { directorExists: false })
    ).toEqual([]);
  });
});
