// lib/rbac.ts
//
// Role policy for the areas the matrix in `SPECS.md` §4.2 governs: spaces,
// users and logs. It lives here — not repeated in each handler — so a rule can
// be read, tested and changed in one place.
//
// `lib/apiAuth.ts` owns the session helpers (`getSessionUser`, `isViewer`,
// `isPrivileged`, `canViewValue`). This module owns the policy that answers
// "may this role do X to this record?".

import type { UserRole } from "@prisma/client";

/** The subset of a user the rules need. */
export interface RbacActor {
  role: UserRole;
  /** The creator may seed the single DIRECTOR once (see `canAssignRole`). */
  isCreator?: boolean;
}

const USER_ROLES: readonly UserRole[] = ["VIEWER", "MANAGER", "ADMIN", "DIRECTOR"];

/** Narrows an untrusted request value to a role, without defaulting silently. */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Spaces are structural: renaming or deleting one changes every active inside
 * it. Only DIRECTOR and ADMIN manage them; MANAGER edits actives and categories.
 */
export function canManageSpaces(actor: Pick<RbacActor, "role"> | null | undefined): boolean {
  return actor?.role === "DIRECTOR" || actor?.role === "ADMIN";
}

/** Logs are audit data: every non-VIEWER reads, DIRECTOR/ADMIN may purge. */
export function canReadLogs(actor: Pick<RbacActor, "role"> | null | undefined): boolean {
  return !!actor && actor.role !== "VIEWER";
}

export function canClearLogs(actor: Pick<RbacActor, "role"> | null | undefined): boolean {
  return actor?.role === "DIRECTOR" || actor?.role === "ADMIN";
}

/**
 * Whether `actor` may edit or delete a user that currently has `targetRole`.
 *
 * - DIRECTOR manages everyone.
 * - ADMIN manages everyone except a DIRECTOR.
 * - MANAGER manages only VIEWER.
 * - VIEWER manages no one.
 *
 * The target's *current* role is what matters: a MANAGER promoting a VIEWER
 * still has to be allowed to touch a VIEWER, and the new role is checked
 * separately by `canAssignRole`.
 */
export function canActOnUser(
  actor: Pick<RbacActor, "role"> | null | undefined,
  targetRole: UserRole
): boolean {
  switch (actor?.role) {
    case "DIRECTOR":
      return true;
    case "ADMIN":
      return targetRole !== "DIRECTOR";
    case "MANAGER":
      return targetRole === "VIEWER";
    default:
      return false;
  }
}

/**
 * Roles `actor` may assign to a user (on creation or on a role change).
 * DIRECTOR is a singleton and is not on this list: it is seeded once by the
 * creator, through the exception in `canAssignRole`.
 */
export function assignableRoles(actor: Pick<RbacActor, "role"> | null | undefined): UserRole[] {
  switch (actor?.role) {
    case "DIRECTOR":
    case "ADMIN":
      return ["VIEWER", "MANAGER", "ADMIN"];
    case "MANAGER":
      return ["VIEWER"];
    default:
      return [];
  }
}

/**
 * Whether `actor` may create a user with `targetRole` or change a user to it.
 *
 * The single exception is the creator seeding the DIRECTOR: only `isCreator`
 * may do it, and only while no DIRECTOR exists. This mirrors the UI, which
 * offers the DIRECTOR option to the creator only, and the bootstrap flow in
 * `pages/api/auth/signup.ts`.
 */
export function canAssignRole(
  actor: RbacActor | null | undefined,
  targetRole: UserRole,
  options: { directorExists: boolean }
): boolean {
  if (targetRole === "DIRECTOR") {
    return !!actor?.isCreator && !options.directorExists;
  }
  return assignableRoles(actor).includes(targetRole);
}
