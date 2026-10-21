// lib/settings/roleOptions.ts
import type { UserRole } from "@prisma/client";
import { assignableRoles, type RbacActor } from "@/lib/rbac";

export interface RoleOption {
  value: UserRole;
  label: string;
  indicatorColor: string;
}

const ROLE_META: Record<UserRole, Omit<RoleOption, "value">> = {
  VIEWER: { label: "Visualizador", indicatorColor: "bg-blue-500" },
  MANAGER: { label: "Gerente", indicatorColor: "bg-amber-500" },
  ADMIN: { label: "Administrador", indicatorColor: "bg-indigo-500" },
  DIRECTOR: { label: "Diretor", indicatorColor: "bg-emerald-500" },
};

/**
 * Options the role selector may show for `actor`.
 *
 * Delegates the authorization to `assignableRoles`/`canAssignRole` in
 * `lib/rbac.ts`; this module only adds the labels and colors used by the UI.
 * DIRECTOR is a singleton: it appears for the creator while no DIRECTOR exists.
 */
export function buildRoleOptions(
  actor: RbacActor | null | undefined,
  options: { directorExists: boolean }
): RoleOption[] {
  const roles = assignableRoles(actor);

  // A creator with no assignable role (e.g. VIEWER) still sees no options:
  // the selector is only shown to roles that manage users at all.
  if (roles.length > 0 && actor?.isCreator && !options.directorExists) {
    roles.push("DIRECTOR");
  }

  return roles.map((role) => ({ value: role, ...ROLE_META[role] }));
}
