import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { toIso } from "@/lib/helpers/format";

const db = () => getAdminDb();

export async function getFavoriteSlugs(uid) {
  const snap = await db().collection("favorites").where("uid", "==", uid).get();
  return snap.docs
    .map((d) => d.data())
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
    .map((d) => d.toolSlug);
}

export async function listProjects(uid) {
  const snap = await db().collection("projects").where("ownerId", "==", uid).orderBy("updatedAt", "desc").limit(100).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return { id: d.id, name: x.name, description: x.description || "", assetCount: x.assetCount || 0, updatedAt: toIso(x.updatedAt) };
  });
}

export async function listNotifications(uid, limit = 50) {
  const snap = await db().collection("notifications").where("userId", "==", uid).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return { id: d.id, title: x.title, body: x.body || "", read: !!x.read, createdAt: toIso(x.createdAt) };
  });
}

// Used in the layout on every page, so it must never take the dashboard down.
export async function countUnread(uid) {
  try {
    const s = await db().collection("notifications").where("userId", "==", uid).where("read", "==", false).count().get();
    return s.data().count;
  } catch (err) {
    console.error("[dashboard] unread count failed:", err?.message);
    return 0;
  }
}

export async function listGenerations(uid, limit = 25) {
  const snap = await db().collection("generations").where("userId", "==", uid).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      toolSlug: x.toolSlug || "",
      toolName: x.toolName || x.toolSlug || "Unknown tool",
      type: x.type || "",
      status: x.status || "unknown",
      credits: typeof x.creditsCharged === "number" ? x.creditsCharged : null,
      outputAssetId: x.output?.assetId || null,
      createdAt: toIso(x.createdAt),
    };
  });
}

export async function getOverviewStats(uid) {
  const base = () => db().collection("generations").where("userId", "==", uid);
  const [total, ok, failed] = await Promise.all([
    base().count().get(),
    base().where("status", "==", "succeeded").count().get(),
    base().where("status", "==", "failed").count().get(),
  ]);
  return { total: total.data().count, succeeded: ok.data().count, failed: failed.data().count };
}
