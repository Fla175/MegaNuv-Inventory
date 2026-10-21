// lib/hooks/useSettingsPermissions.ts
import { useCallback } from "react";
import type { RoleOption } from "@/lib/settings/roleOptions";
import { buildRoleOptions } from "@/lib/settings/roleOptions";
import type { SettingsUser } from "@/components/settings/types";

/**
 * Flags derived from the current user's role, mirroring the tabs and actions
 * that `/api/users`, `/api/father-spaces` and `/api/logs` authorize.
 */
export function useSettingsPermissions(user: SettingsUser | null) {
  const isDirector = user?.role === "DIRECTOR";
  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";
  const canManageAll = isDirector || isAdmin;
  const canManageUsers = isDirector || isAdmin || isManager;
  const canSeeLogs = isDirector || isAdmin || isManager;

  const buildOptions = useCallback(
    (existingDirector: boolean): RoleOption[] =>
      buildRoleOptions(user, { directorExists: existingDirector }),
    [user]
  );

  return {
    isDirector,
    isAdmin,
    isManager,
    canManageAll,
    canManageUsers,
    canSeeLogs,
    buildRoleOptions: buildOptions,
  };
}
