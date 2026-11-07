import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { getTool } from "@/lib/tools/registry";
import { normalizeOverride, resolveToolPricing } from "@/lib/admin/tool-config";

// Admin overrides live in the `tools` collection (document id = tool slug). Cached for 30 s per server
// instance, so a change can take up to 30 s to reach other instances.
const TTL_MS = 30_000;
let cache = { at: 0, data: {} };

export async function getToolOverrides() {
  if (Date.now() - cache.at < TTL_MS) return cache.data;
  const snap = await getAdminDb().collection("tools").get();
  const data = {};
  for (const d of snap.docs) { const o = normalizeOverride(d.data()); if (o) data[d.id] = o; }
  cache = { at: Date.now(), data };
  return data;
}

export const invalidateToolOverrides = () => { cache = { at: 0, data: cache.data }; };

// Registry tool merged with the admin override: { ...tool, enabled, credits }. Throws if the config cannot be
// read, so job creation fails closed instead of using a stale price or ignoring a disabled tool.
export async function getEffectiveTool(slug) {
  const tool = getTool(slug);
  if (!tool) return null;
  const overrides = await getToolOverrides();
  return { ...tool, ...resolveToolPricing(tool, overrides[slug]) };
}
