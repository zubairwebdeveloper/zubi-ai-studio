import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { createApiKeyService } from "@/lib/api/keys-core";
import { LIMITS } from "@/config/limits";

export const apiKeys = createApiKeyService({
  getDb: getAdminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
  increment: (n) => FieldValue.increment(n),
  maxKeys: LIMITS.maxApiKeysPerUser,
});
