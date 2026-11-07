import { authenticateApiRequest, apiJson } from "@/lib/api/auth";
import { apiSupports } from "@/lib/api/keys";
import { getToolRuntime } from "@/lib/ai/availability";
import { toolBindings } from "@/config/tool-bindings";
import { getTool } from "@/lib/tools/registry";

// GET /api/v1/tools : the tools you can call through the API right now, with their price in credits.
export async function GET(request) {
  const a = await authenticateApiRequest(request);
  if (!a.ok) return a.response;
  const runtime = await getToolRuntime();
  const tools = runtime.liveSlugs
    .filter((slug) => apiSupports(toolBindings[slug]))
    .map((slug) => {
      const b = toolBindings[slug], t = getTool(slug);
      return {
        slug, name: t.name, credits: runtime.credits[slug] ?? t.credits, kind: b.kind, max_input_chars: b.maxInputChars || 0,
        chat: b.mode === "chat", options: (b.options || []).map((o) => ({ name: o.name, choices: o.choices })),
      };
    });
  return apiJson({ tools });
}
