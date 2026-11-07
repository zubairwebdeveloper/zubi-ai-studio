// Run: npm run verify    Runs every test suite and fails if any of them fails.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const suites = fs.readdirSync("scripts").filter((f) => /^verify-.+\.mjs$/.test(f) && f !== "verify-all.mjs").sort();
let failed = 0;
for (const s of suites) {
  const r = spawnSync(process.execPath, [`scripts/${s}`], { encoding: "utf8" });
  const last = (r.stdout || "").trim().split("\n").filter((l) => !/warning|Reparsing|eliminate|trace-warnings|MODULE_TYPELESS/i.test(l)).pop() || "";
  if (r.status === 0) console.log(`PASS  ${s.padEnd(26)} ${last}`);
  else { failed++; console.log(`FAIL  ${s}\n${(r.stderr || r.stdout || "").split("\n").filter((l) => l.startsWith("FAIL")).join("\n") || r.stderr}`); }
}
console.log(failed ? `\n${failed} of ${suites.length} suites FAILED` : `\nAll ${suites.length} suites passed.`);
process.exit(failed ? 1 : 0);
