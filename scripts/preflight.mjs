// Launch check. Run with your real environment:
//   node --env-file=.env.local scripts/preflight.mjs            (development settings)
//   node --env-file=.env.production scripts/preflight.mjs --production
import fs from "node:fs";
import { runPreflight } from "../lib/ops/preflight.js";

const production = process.argv.includes("--production");
const { findings, failed, warnings } = runPreflight({
  env: process.env,
  indexesJson: JSON.parse(fs.readFileSync("firebase/firestore.indexes.json", "utf8")),
  rulesText: fs.readFileSync("firebase/firestore.rules", "utf8"),
  production,
});
const icon = { fail: "FAIL", warn: "WARN", ok: " OK " };
for (const f of findings) console.log(`[${icon[f.level]}] ${f.message}`);
console.log(`\n${failed} failure(s), ${warnings} warning(s). Secrets are never printed.`);
process.exit(failed ? 1 : 0);
