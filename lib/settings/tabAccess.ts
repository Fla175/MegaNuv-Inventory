// lib/settings/tabAccess.ts
import type { SettingsTab } from "@/components/settings/types";

export interface SettingsTabPermissions {
  canManageAll: boolean;
  canManageUsers: boolean;
  canSeeLogs: boolean;
}

/** Mirrors the old `refreshActiveTabData` guards, one place per tab. */
export function canFetchTab(
  tab: SettingsTab,
  permissions: SettingsTabPermissions
): boolean {
  if (tab === "users") return true;
  if (tab === "spaces") return permissions.canManageAll;
  if (tab === "categories") return permissions.canManageUsers;
  if (tab === "logs") return permissions.canSeeLogs;
  return false;
}
