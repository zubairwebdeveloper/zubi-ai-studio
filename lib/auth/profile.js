import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export class SuspendedError extends Error {}

// Creates users/{uid} on first sign-in, otherwise refreshes login info.
// The role is NEVER taken from the client and is never changed here: new users are always USER.
export async function upsertUserProfile(decoded) {
  const ref = getAdminDb().collection("users").doc(decoded.uid);
  return getAdminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      const data = {
        uid: decoded.uid,
        email: decoded.email || null,
        displayName: decoded.name || null,
        photoURL: decoded.picture || null,
        emailVerified: !!decoded.email_verified,
        role: "USER",
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
      };
      tx.set(ref, data);
      tx.set(getAdminDb().collection("notifications").doc(), {
        userId: decoded.uid,
        title: "Welcome to AI Studio",
        body: "Browse the tools directory and save the ones you want to use.",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { role: "USER", status: "active" };
    }
    const existing = snap.data();
    if (existing.status === "suspended") throw new SuspendedError("Account suspended");
    tx.update(ref, { emailVerified: !!decoded.email_verified, lastLoginAt: FieldValue.serverTimestamp() });
    return { role: existing.role, status: existing.status };
  });
}
