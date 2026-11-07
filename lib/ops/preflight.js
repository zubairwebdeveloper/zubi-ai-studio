// Pure launch checks: feed it the environment and the Firebase files, get findings back.
// Used by scripts/preflight.mjs (real env) and by the tests (fake envs).
export const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "NEXT_PUBLIC_FIREBASE_APP_ID",
];
export const REQUIRED_SERVER = ["FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY", "CRON_SECRET"];

// Every composite index the code relies on. Keep in sync with firebase/firestore.indexes.json (a test enforces it).
export const REQUIRED_INDEXES = [
  "projects:ownerId,updatedAt", "notifications:userId,createdAt", "generations:userId,createdAt", "generations:userId,type,createdAt",
  "generations:status,createdAt", "generationJobs:status,updatedAt", "generationJobs:needsReview,updatedAt",
  "creditTransactions:userId,createdAt", "creditReservations:status,updatedAt", "apiUsage:ownerId,day",
];

const SECRET_NAME = /(SECRET|PRIVATE|TOKEN|PASSWORD|OPENAI|GEMINI|REMOVE_?BG|REPLICATE|FAL_|ELEVEN|HUGGING|RESEND)/i;
const has = (env, k) => typeof env[k] === "string" && env[k].trim() !== "";

export function runPreflight({ env, indexesJson, rulesText, production = false }) {
  const out = [];
  const add = (level, id, message) => out.push({ level, id, message });

  for (const k of [...REQUIRED_PUBLIC, ...REQUIRED_SERVER]) if (!has(env, k)) add("fail", k, `${k} is not set.`);

  if (has(env, "NEXT_PUBLIC_SITE_URL")) {
    let url = null;
    try { url = new URL(env.NEXT_PUBLIC_SITE_URL); } catch { add("fail", "SITE_URL", "NEXT_PUBLIC_SITE_URL is not a valid URL."); }
    if (url && production && (url.protocol !== "https:" || /^(localhost|127\.)/.test(url.hostname))) add("fail", "SITE_URL", "In production NEXT_PUBLIC_SITE_URL must be your public https address.");
  }
  if (has(env, "FIREBASE_ADMIN_PRIVATE_KEY")) {
    const key = env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
    if (!key.includes("BEGIN PRIVATE KEY") || !key.includes("END PRIVATE KEY")) add("fail", "PRIVATE_KEY", "FIREBASE_ADMIN_PRIVATE_KEY is not a PEM private key (keep it on one line with \\n escapes).");
  }
  if (has(env, "FIREBASE_ADMIN_CLIENT_EMAIL") && !/@.+\.iam\.gserviceaccount\.com$/.test(env.FIREBASE_ADMIN_CLIENT_EMAIL)) add("warn", "CLIENT_EMAIL", "FIREBASE_ADMIN_CLIENT_EMAIL does not look like a service account address.");
  if (has(env, "CRON_SECRET") && env.CRON_SECRET.length < 32) add("fail", "CRON_SECRET", "CRON_SECRET must be at least 32 characters (it protects the scheduled maintenance routes).");

  for (const k of Object.keys(env)) {
    if (k.startsWith("NEXT_PUBLIC_") && k !== "NEXT_PUBLIC_FIREBASE_API_KEY" && SECRET_NAME.test(k)) add("fail", k, `${k} is exposed to the browser. Remove the NEXT_PUBLIC_ prefix.`);
  }

  const textReady = (has(env, "GEMINI_API_KEY") && has(env, "GEMINI_TEXT_MODEL")) || (has(env, "OPENAI_API_KEY") && has(env, "OPENAI_TEXT_MODEL"));
  const anyProvider = ["GEMINI_API_KEY", "OPENAI_API_KEY", "REMOVE_BG_API_KEY"].some((k) => has(env, k));
  if (!anyProvider) add("warn", "PROVIDERS", "No AI provider key is set: every tool will show Coming soon.");
  else if (!textReady) add("warn", "TEXT_MODEL", "No text model is fully configured (needs a key AND a model id): the writing, chat and PDF tools will not be Live.");
  if (has(env, "GEMINI_API_KEY") && !has(env, "GEMINI_TEXT_MODEL")) add("warn", "GEMINI_TEXT_MODEL", "GEMINI_API_KEY is set but GEMINI_TEXT_MODEL is not.");
  if (has(env, "OPENAI_API_KEY") && !has(env, "OPENAI_TEXT_MODEL")) add("warn", "OPENAI_TEXT_MODEL", "OPENAI_API_KEY is set but OPENAI_TEXT_MODEL is not.");
  if (has(env, "OPENAI_API_KEY") && !has(env, "OPENAI_IMAGE_MODEL")) add("warn", "OPENAI_IMAGE_MODEL", "OPENAI_API_KEY is set but OPENAI_IMAGE_MODEL is not: image generation/editing will not be Live.");

  const have = new Set((indexesJson?.indexes || []).map((i) => `${i.collectionGroup}:${i.fields.map((f) => f.fieldPath).join(",")}`));
  for (const idx of REQUIRED_INDEXES) if (!have.has(idx)) add("fail", `INDEX ${idx}`, `Missing Firestore index ${idx} in firebase/firestore.indexes.json.`);
  if (!/match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/.test(rulesText || "")) add("fail", "RULES", "firestore.rules has no default-deny rule.");

  if (!out.some((f) => f.level === "fail")) add("ok", "ALL", "All required settings are present.");
  return { findings: out, failed: out.filter((f) => f.level === "fail").length, warnings: out.filter((f) => f.level === "warn").length };
}
