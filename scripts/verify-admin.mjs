// Run: npm run test:admin  (pure rules + structural security checks; no Firebase)
import fs from "node:fs";
import path from "node:path";
import { PERMISSIONS, can, canActOn, canAssignRole, ASSIGNABLE_ROLES, adjustLimitFor } from "../lib/admin/permissions.js";
import { validateStatusChange, validateRoleChange, validateCreditAdjustment, validateToolUpdate, isUid } from "../lib/admin/validate.js";
import { normalizeOverride, resolveToolPricing } from "../lib/admin/tool-config.js";
import { ROLES } from "../lib/auth/roles.js";

let failed = 0;
const check = (name, cond) => { if (!cond) { failed++; console.error("FAIL:", name); } };
const read = (f) => fs.readFileSync(f, "utf8");
const UID = "a".repeat(28);

// ---- permissions
for (const role of ["USER", "PRO", "AGENCY"]) check(`${role} has no admin permission`, Object.keys(PERMISSIONS).every((p) => !can(role, p)));
check("ADMIN has every permission except roles.manage", Object.keys(PERMISSIONS).every((p) => can("ADMIN", p) === (p !== "roles.manage")));
check("SUPER_ADMIN has every permission", Object.keys(PERMISSIONS).every((p) => can("SUPER_ADMIN", p)));
check("unknown role / permission denied", !can("HACKER", "users.read") && !can(undefined, "users.read") && !can("ADMIN", "made.up") && !can("SUPER_ADMIN", "made.up"));
check("every permission names only real roles", Object.values(PERMISSIONS).flat().every((r) => ROLES.includes(r)));

// ---- who may act on whom
check("ADMIN can act on USER/PRO/AGENCY", ["USER", "PRO", "AGENCY"].every((r) => canActOn("ADMIN", r)));
check("ADMIN cannot act on ADMIN or SUPER_ADMIN", !canActOn("ADMIN", "ADMIN") && !canActOn("ADMIN", "SUPER_ADMIN"));
check("SUPER_ADMIN can act on ADMIN but NOT on another SUPER_ADMIN", canActOn("SUPER_ADMIN", "ADMIN") && !canActOn("SUPER_ADMIN", "SUPER_ADMIN"));
check("regular roles cannot act on anyone", ["USER", "PRO", "AGENCY"].every((a) => ROLES.every((t) => !canActOn(a, t))));
check("unknown roles never pass", !canActOn("HACKER", "USER") && !canActOn("SUPER_ADMIN", "HACKER") && !canActOn(undefined, "USER"));

// ---- role assignment
check("SUPER_ADMIN is never assignable from the UI", !ASSIGNABLE_ROLES.includes("SUPER_ADMIN") && ROLES.every((t) => !canAssignRole("SUPER_ADMIN", t, "SUPER_ADMIN")));
check("SUPER_ADMIN can assign USER/PRO/AGENCY/ADMIN to a lower-ranked user", ["USER", "PRO", "AGENCY", "ADMIN"].every((r) => canAssignRole("SUPER_ADMIN", "USER", r)));
check("SUPER_ADMIN cannot change another SUPER_ADMIN", !canAssignRole("SUPER_ADMIN", "SUPER_ADMIN", "USER"));
check("ADMIN cannot assign any role", ROLES.every((t) => ASSIGNABLE_ROLES.every((n) => !canAssignRole("ADMIN", t, n))));
check("invalid new role rejected", !canAssignRole("SUPER_ADMIN", "USER", "root") && !canAssignRole("SUPER_ADMIN", "USER", undefined));

// ---- credit adjustment validation
check("limits per role", adjustLimitFor("ADMIN") === 500 && adjustLimitFor("SUPER_ADMIN") === 10_000 && adjustLimitFor("USER") === 0 && adjustLimitFor("HACKER") === 0);
const adj = (o, role = "ADMIN") => validateCreditAdjustment({ uid: UID, amount: 50, reason: "support refund", idempotencyKey: "idem-key-123", ...o }, role);
check("valid adjustment", adj({}).ok && adj({ amount: -50 }).ok);
for (const bad of [0, 1.5, NaN, "50", null, undefined, Infinity]) check(`bad amount rejected: ${String(bad)}`, !adj({ amount: bad }).ok);
check("ADMIN capped at 500, SUPER_ADMIN at 10000", !adj({ amount: 501 }).ok && adj({ amount: 500 }).ok && !adj({ amount: -501 }).ok && adj({ amount: 10_000 }, "SUPER_ADMIN").ok && !adj({ amount: 10_001 }, "SUPER_ADMIN").ok);
check("non-admin role has a limit of 0", !adj({ amount: 1 }, "USER").ok);
check("reason required (5-200 chars)", !adj({ reason: "" }).ok && !adj({ reason: "  ab " }).ok && !adj({ reason: "x".repeat(201) }).ok && !adj({ reason: 5 }).ok);
check("idempotency key required and well-formed", !adj({ idempotencyKey: undefined }).ok && !adj({ idempotencyKey: "short" }).ok && !adj({ idempotencyKey: "has spaces here" }).ok);
check("uid must look like a uid (no path tricks)", !adj({ uid: "../users/x" }).ok && !adj({ uid: "" }).ok && !adj({ uid: "a/b" }).ok && isUid(UID));

// ---- status + role validation
check("status values", validateStatusChange({ uid: UID, status: "suspended", reason: "abuse report" }).ok && !validateStatusChange({ uid: UID, status: "deleted", reason: "abuse report" }).ok && !validateStatusChange({ uid: UID, status: "active", reason: "" }).ok);
check("role validation blocks SUPER_ADMIN", validateRoleChange({ uid: UID, role: "ADMIN" }).ok && !validateRoleChange({ uid: UID, role: "SUPER_ADMIN" }).ok && !validateRoleChange({ uid: UID, role: "x" }).ok);

// ---- tool config
check("no override -> defaults", resolveToolPricing({ credits: 5 }, undefined).credits === 5 && resolveToolPricing({ credits: 5 }, null).enabled === true);
check("override applied", resolveToolPricing({ credits: 5 }, { enabled: false, credits: 9 }).enabled === false && resolveToolPricing({ credits: 5 }, { enabled: true, credits: 9 }).credits === 9);
for (const bad of [0, -3, 1.5, 10_001, "7", NaN, null]) check(`corrupt stored price falls back to default: ${String(bad)}`, resolveToolPricing({ credits: 5 }, { enabled: true, credits: bad }).credits === 5);
check("normalizeOverride rejects junk", normalizeOverride("x") === null && normalizeOverride(7) === null && normalizeOverride(null) === null);
check("tool update validation", validateToolUpdate({ slug: "ai-translator", enabled: true, credits: 3 }).ok && validateToolUpdate({ slug: "ai-translator", enabled: false, credits: "" }).value.credits === null
  && !validateToolUpdate({ slug: "ai-translator", enabled: "yes", credits: 3 }).ok && !validateToolUpdate({ slug: "../x", enabled: true, credits: 3 }).ok
  && !validateToolUpdate({ slug: "a", enabled: true, credits: 0 }).ok && !validateToolUpdate({ slug: "a", enabled: true, credits: 10_001 }).ok && !validateToolUpdate({ slug: "a", enabled: true, credits: 2.5 }).ok);

// ---- structure (files are added by the same phase; checks run once they exist)
function walk(d, out = []) { for (const f of fs.readdirSync(d)) { if (f === "node_modules" || f === ".next") continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, out) : /\.(jsx?|mjs)$/.test(f) && out.push(p); } return out; }
if (fs.existsSync("lib/actions/admin.js")) {
  const src = read("lib/actions/admin.js");
  const fns = src.match(/export async function \w+/g) || [];
  check("admin actions exist", fns.length >= 4);
  check("EVERY admin action checks permission first", (src.match(/await adminActor\("[a-z.]+"\)/g) || []).length === fns.length);
  check("every mutation writes an audit entry", (src.match(/auditEntry\(/g) || []).length >= fns.length);
  check("actions never read the actor's role from the request", !/input\??\.actorRole|input\??\.actor\b/.test(src));
  check("self-service blocked", (src.match(/actor\.uid/g) || []).length >= 3);
  check("role/status/credit actions enforce the outranking rule", (src.match(/canActOn\(actor\.role/g) || []).length >= 3 && src.includes("canAssignRole(actor.role"));
  check("suspending revokes sessions", src.includes("revokeRefreshTokens"));
  check("credit adjustments go through the ledger service", src.includes("credits.grant(") && src.includes('type: "adjust"') && !src.includes('collection("creditWallets")'));
  check("tool changes invalidate the cache", src.includes("invalidateToolOverrides()"));
}
if (fs.existsSync("lib/admin/guard.js")) {
  const g = read("lib/admin/guard.js");
  check("guard is server-only and uses the permission table", g.includes('import "server-only"') && g.includes("can(") && g.includes("notFound"));
}
const adminPages = walk("app/admin").filter((f) => f.endsWith("page.jsx"));
check("admin pages exist", adminPages.length >= 8);
for (const f of adminPages) check(`admin page checks a permission: ${f}`, /requirePermission\("[a-z.]+"\)/.test(read(f)));
check("admin layout requires an admin role", /requireRole\("ADMIN"\)/.test(read("app/admin/layout.jsx")));
for (const f of ["lib/admin/data.js", "lib/admin/audit.js", "lib/admin/guard.js", "lib/admin/tool-store.js"]) if (fs.existsSync(f)) check(`${f} is server-only`, read(f).includes('import "server-only"'));
for (const f of walk(".")) if (/^["']use client["']/.test(read(f).trimStart())) check(`client file must not import admin server code: ${f}`, !/lib\/admin\/(data|guard|audit|tool-store)|lib\/firebase\/admin/.test(read(f)));
if (fs.existsSync("config/admin-nav.js")) {
  const nav = read("config/admin-nav.js");
  for (const m of nav.matchAll(/href: "(\/admin[^"]*)"/g)) check(`admin nav target exists: ${m[1]}`, fs.existsSync(m[1] === "/admin" ? "app/admin/page.jsx" : `app${m[1]}/page.jsx`));
}
const rules = read("firebase/firestore.rules");
check("auditLogs and tools have no client access (default deny)", !/match \/auditLogs/.test(rules) && !/match \/tools\//.test(rules));
if (fs.existsSync("lib/ai/jobs.js")) {
  const j = read("lib/ai/jobs.js");
  check("createJob honors admin tool config (disabled + price)", j.includes("getEffectiveTool(") && /enabled/.test(j) && j.includes("amount: effective.credits"));
}

if (failed) process.exit(1);
console.log("admin OK");
