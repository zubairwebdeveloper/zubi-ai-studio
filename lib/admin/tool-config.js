// Pure: how an admin override (stored in the `tools` collection) combines with the registry defaults.
export const PRICE_LIMITS = { min: 1, max: 10_000 };

// Anything malformed falls back to the default instead of being trusted.
export function normalizeOverride(raw) {
  if (!raw || typeof raw !== "object") return null;
  const c = raw.credits;
  return { enabled: raw.enabled !== false, credits: Number.isInteger(c) && c >= PRICE_LIMITS.min && c <= PRICE_LIMITS.max ? c : null };
}

export function resolveToolPricing(tool, override) {
  const o = normalizeOverride(override);
  return { enabled: o ? o.enabled : true, credits: o?.credits ?? tool.credits };
}
