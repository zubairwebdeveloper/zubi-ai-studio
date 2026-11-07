// Pure permission rules for the admin area (no Firebase), so every rule is unit-tested.
import { ROLES, hasRole } from "../auth/roles.js";

// Permission -> roles allowed. Everything not listed is denied. USER, PRO and AGENCY have no admin permissions.
export const PERMISSIONS = {
  "analytics.read": ["ADMIN", "SUPER_ADMIN"],
  "users.read": ["ADMIN", "SUPER_ADMIN"],
  "users.suspend": ["ADMIN", "SUPER_ADMIN"],
  "roles.manage": ["SUPER_ADMIN"],
  "credits.read": ["ADMIN", "SUPER_ADMIN"],
  "credits.adjust": ["ADMIN", "SUPER_ADMIN"],
  "jobs.read": ["ADMIN", "SUPER_ADMIN"],
  "tools.manage": ["ADMIN", "SUPER_ADMIN"],
  "providers.read": ["ADMIN", "SUPER_ADMIN"],
  "audit.read": ["ADMIN", "SUPER_ADMIN"],
};

export const can = (role, permission) => !!PERMISSIONS[permission]?.includes(role) && ROLES.includes(role);

const rank = (role) => ROLES.indexOf(role);

// An admin may act on a user only if the admin STRICTLY outranks them. So an ADMIN cannot touch another
// ADMIN or a SUPER_ADMIN, and nobody can act on a SUPER_ADMIN from the UI (SUPER_ADMIN is changed only by CLI).
// The actor must also be an admin-level role itself: a PRO or AGENCY user outranks a USER but may not act on anyone.
export const canActOn = (actorRole, targetRole) =>
  rank(actorRole) >= rank("ADMIN") && rank(targetRole) >= 0 && rank(actorRole) > rank(targetRole);

// Roles that can be handed out from the UI. SUPER_ADMIN is never one of them.
export const ASSIGNABLE_ROLES = ROLES.filter((r) => r !== "SUPER_ADMIN");

export function canAssignRole(actorRole, targetCurrentRole, newRole) {
  return (
    can(actorRole, "roles.manage") &&
    ASSIGNABLE_ROLES.includes(newRole) &&
    canActOn(actorRole, targetCurrentRole) &&
    rank(newRole) < rank(actorRole)
  );
}

// Largest single credit adjustment (up or down) per role.
export const ADJUST_LIMITS = { ADMIN: 500, SUPER_ADMIN: 10_000 };
export const adjustLimitFor = (role) => ADJUST_LIMITS[role] || 0;

export { hasRole };
