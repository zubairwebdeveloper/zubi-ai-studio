// Per-tool options (tone, length, language...) and chat history. Everything the client sends is
// re-validated here against the tool's binding; unknown or invalid values fall back to safe defaults.
export function normalizeOptions(binding, raw) {
  const out = {};
  for (const opt of binding.options || []) {
    const v = raw && typeof raw === "object" ? raw[opt.name] : undefined;
    out[opt.name] = typeof v === "string" && opt.choices.includes(v) ? v : opt.choices[0];
  }
  return out;
}

export const HISTORY_LIMITS = { maxMessages: 12, maxCharsPerMessage: 4000, maxTotalChars: 20_000 };

export function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const clean = [];
  for (const m of raw.slice(-HISTORY_LIMITS.maxMessages)) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.text !== "string" || !m.text.trim()) continue;
    clean.push({ role: m.role, text: m.text.trim().slice(0, HISTORY_LIMITS.maxCharsPerMessage) });
  }
  let total = clean.reduce((n, m) => n + m.text.length, 0);
  while (clean.length && total > HISTORY_LIMITS.maxTotalChars) total -= clean.shift().text.length; // drop oldest first
  return clean;
}
