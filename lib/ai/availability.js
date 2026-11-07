import "server-only";
import { toolBindings } from "@/config/tool-bindings";
import { getAvailableModels } from "@/lib/ai/registry";
import { getTool } from "@/lib/tools/registry";
import { getToolOverrides } from "@/lib/admin/tool-store";
import { resolveToolPricing } from "@/lib/admin/tool-config";

export function resolveModelForTool(slug) {
  const binding = toolBindings[slug];
  return binding ? getAvailableModels(binding.modelKind || binding.kind)[0] || null : null;
}

// What the dashboard should show: which tools are Live (provider configured AND not turned off by an admin)
// and which tools have an admin-set price. If the override store cannot be read, defaults are shown;
// job creation still fails closed, so nothing is charged or run on a wrong assumption.
export async function getToolRuntime() {
  let overrides = {};
  try { overrides = await getToolOverrides(); } catch (err) { console.error("[tools] override read failed:", err?.message); }
  const liveSlugs = [], credits = {};
  for (const slug of Object.keys(toolBindings)) {
    const tool = getTool(slug);
    if (tool && resolveModelForTool(slug) && resolveToolPricing(tool, overrides[slug]).enabled) liveSlugs.push(slug);
  }
  for (const [slug, o] of Object.entries(overrides)) if (o.credits !== null && getTool(slug)) credits[slug] = o.credits;
  return { liveSlugs, credits };
}
