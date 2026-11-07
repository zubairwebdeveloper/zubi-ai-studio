import "server-only";
import { FieldValue } from "firebase-admin/firestore";

// One audit document per admin change. Written in the same batch as the change wherever possible.
export function auditEntry({ actor, action, targetType, targetId, details = {} }) {
  return {
    action, targetType, targetId, details,
    actorUid: actor.uid, actorEmail: actor.email || null, actorRole: actor.role,
    createdAt: FieldValue.serverTimestamp(),
  };
}
