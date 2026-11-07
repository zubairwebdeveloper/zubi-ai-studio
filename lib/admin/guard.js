import "server-only";
import { notFound } from "next/navigation";
import { requireUser, getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/admin/permissions";

// For pages: signed in + verified + holds the permission, otherwise a 404 (the admin area is not advertised).
export async function requirePermission(permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) notFound();
  return user;
}

// For server actions: returns the acting admin, or null. The role always comes from the database
// (via the session), never from anything the browser sent.
export async function adminActor(permission) {
  const user = await getSessionUser();
  if (!user || !user.emailVerified) return null;
  return can(user.role, permission) ? user : null;
}
