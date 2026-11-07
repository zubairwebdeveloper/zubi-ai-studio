import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { toIso } from "@/lib/helpers/format";
import { isUid } from "@/lib/admin/validate";
import { credits } from "@/lib/credits/service";

const db = () => getAdminDb();
export const PAGE_SIZE = 25;

const userRow = (d) => {
  const x = d.data();
  return { uid: d.id, email: x.email || "", name: x.displayName || "", role: x.role || "USER", status: x.status || "active",
    createdAt: toIso(x.createdAt), lastLoginAt: toIso(x.lastLoginAt) };
};

// Ordered by email so one cursor (the last email) pages through both plain listing and prefix search.
export async function listUsers({ q = "", after = "" } = {}) {
  const search = q.trim();
  if (isUid(search)) { const d = await db().collection("users").doc(search).get(); return { rows: d.exists ? [userRow(d)] : [], next: null }; }
  let query = db().collection("users").orderBy("email");
  if (search) { const s = search.toLowerCase(); query = query.where("email", ">=", s).where("email", "<", s + "\uf8ff"); }
  if (after) query = query.startAfter(after);
  const snap = await query.limit(PAGE_SIZE + 1).get();
  const rows = snap.docs.slice(0, PAGE_SIZE).map(userRow);
  return { rows, next: snap.docs.length > PAGE_SIZE ? rows.at(-1).email : null };
}

export async function getUserDetail(uid) {
  if (!isUid(uid)) return null;
  const d = await db().collection("users").doc(uid).get();
  if (!d.exists) return null;
  const [wallet, gens, ledger] = await Promise.all([
    credits.peek(uid), // read-only: viewing a user must never create a wallet
    db().collection("generations").where("userId", "==", uid).orderBy("createdAt", "desc").limit(10).get(),
    db().collection("creditTransactions").where("userId", "==", uid).orderBy("createdAt", "desc").limit(10).get(),
  ]);
  return {
    user: userRow(d),
    wallet,
    generations: gens.docs.map((g) => { const x = g.data(); return { id: g.id, toolName: x.toolName, status: x.status, error: x.error || "", createdAt: toIso(x.createdAt) }; }),
    ledger: ledger.docs.map((t) => { const x = t.data(); return { id: t.id, type: x.type, amount: x.amount, delta: x.delta, reason: x.reason, actor: x.actor, createdAt: toIso(x.createdAt) }; }),
  };
}

export async function listJobs(view) {
  if (view === "review") {
    const snap = await db().collection("generationJobs").where("needsReview", "==", true).orderBy("updatedAt", "desc").limit(50).get();
    return snap.docs.map((d) => { const x = d.data(); return { id: d.id, userId: x.userId, toolSlug: x.toolSlug, status: x.status, providerId: x.providerId,
      attempts: x.attempts, error: x.lastError?.message || "", code: x.lastError?.code || "", createdAt: toIso(x.updatedAt) }; });
  }
  let q = db().collection("generations");
  if (view === "failed") q = q.where("status", "==", "failed");
  const snap = await q.orderBy("createdAt", "desc").limit(50).get();
  return snap.docs.map((d) => { const x = d.data(); return { id: d.id, userId: x.userId, toolSlug: x.toolSlug, toolName: x.toolName, status: x.status,
    error: x.error || "", credits: x.creditsCharged ?? null, createdAt: toIso(x.createdAt) }; });
}

export async function listLedger(limit = 50) {
  const snap = await db().collection("creditTransactions").orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => { const x = d.data(); return { id: d.id, userId: x.userId, type: x.type, amount: x.amount, delta: x.delta, reason: x.reason, actor: x.actor, createdAt: toIso(x.createdAt) }; });
}

export async function listAudit(limit = 100) {
  const snap = await db().collection("auditLogs").orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => { const x = d.data(); return {
    id: d.id, action: x.action, actor: x.actorEmail || x.actor || "unknown", actorRole: x.actorRole || "",
    target: x.targetId || x.targetUid || x.targetEmail || "", details: x.details || (x.reason ? { reason: x.reason, from: x.from, to: x.to } : {}), createdAt: toIso(x.createdAt) }; });
}

export async function getOverview() {
  const sod = new Date(); sod.setUTCHours(0, 0, 0, 0);
  const count = async (q) => (await q.count().get()).data().count;
  const gens = () => db().collection("generations");
  const [users, suspended, today, failedToday, review] = await Promise.all([
    count(db().collection("users")),
    count(db().collection("users").where("status", "==", "suspended")),
    count(gens().where("createdAt", ">=", sod)),
    count(gens().where("status", "==", "failed").where("createdAt", ">=", sod)),
    count(db().collection("generationJobs").where("needsReview", "==", true)),
  ]);
  return { users, suspended, today, failedToday, review };
}
