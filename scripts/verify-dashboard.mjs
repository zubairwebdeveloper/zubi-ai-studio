// Run: npm run test:dashboard  (static checks; Firestore behavior needs a real project or emulator)
import fs from "node:fs";
import { dashboardNav } from "../config/dashboard-nav.js";
import { formatDate, toIso } from "../lib/helpers/format.js";

let failed = 0;
const check = (name, cond) => { if (!cond) { failed++; console.error("FAIL:", name); } };

for (const item of dashboardNav) {
  const file = item.href === "/dashboard" ? "app/dashboard/page.jsx" : `app/${item.href.slice(1)}/page.jsx`;
  check(`nav page exists: ${item.href}`, fs.existsSync(file));
}

check("formatDate deterministic", formatDate("2026-11-02T23:59:00.000Z") === "Nov 2, 2026");
check("formatDate empty/invalid", formatDate(null) === "" && formatDate("nope") === "");
check("toIso timestamp-like", toIso({ toDate: () => new Date("2026-01-01T00:00:00Z") }) === "2026-01-01T00:00:00.000Z");
check("toIso null", toIso(null) === null);

const idx = JSON.parse(fs.readFileSync("firebase/firestore.indexes.json", "utf8"));
for (const c of ["projects", "notifications", "generations"]) {
  check(`composite index for ${c}`, idx.indexes.some((i) => i.collectionGroup === c));
}

const rules = fs.readFileSync("firebase/firestore.rules", "utf8");
for (const c of ["users", "favorites", "projects", "notifications", "generations"]) {
  check(`rules cover ${c}`, rules.includes(`match /${c}/`));
}
check("rules never allow client writes", !/allow (write|create|update|delete)[^;]*:\s*if\s+(?!false)/.test(rules));
check("catch-all deny present", /document=\*\*[\s\S]*allow read, write: if false/.test(rules));

// every server action must authenticate first
for (const f of ["favorites", "projects", "notifications", "profile", "credits", "api-keys"]) {
  const src = fs.readFileSync(`lib/actions/${f}.js`, "utf8");
  const fns = src.match(/export async function/g)?.length || 0;
  const guards = src.match(/await requireUser\(/g)?.length || 0;
  check(`actions/${f}: every action calls requireUser`, fns > 0 && fns === guards);
}

if (failed) process.exit(1);
console.log("dashboard checks OK");
