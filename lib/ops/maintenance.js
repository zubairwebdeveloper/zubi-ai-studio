import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { createMaintenance } from "@/lib/ops/maintenance-core";

export const maintenance = createMaintenance({ getDb: getAdminDb, toTimestamp: (ms) => Timestamp.fromMillis(ms) });
