import { gemini } from "./providers/gemini.js";
import { openai } from "./providers/openai.js";
import { removebg } from "./providers/removebg.js";

export const providers = { gemini, openai, removebg };

// Model ids are read from env so we never hard-code names that providers retire.
// A model is "available" only when its provider key is set AND (if it needs one) its model env var is set.
const modelDefs = [
  { id: "gemini-text", providerId: "gemini", kind: "text", modelEnv: "GEMINI_TEXT_MODEL" },
  { id: "openai-text", providerId: "openai", kind: "text", modelEnv: "OPENAI_TEXT_MODEL" },
  { id: "openai-image-generate", providerId: "openai", kind: "image-generate", modelEnv: "OPENAI_IMAGE_MODEL" },
  { id: "openai-image-edit", providerId: "openai", kind: "image-edit", modelEnv: "OPENAI_IMAGE_MODEL" },
  { id: "removebg", providerId: "removebg", kind: "image-remove-bg", modelEnv: null },
];

function resolve(def) {
  const provider = providers[def.providerId];
  if (!provider?.isConfigured()) return null;
  const providerModel = def.modelEnv ? process.env[def.modelEnv] : "default";
  if (!providerModel) return null;
  return { id: def.id, providerId: def.providerId, kind: def.kind, providerModel };
}

export function getAvailableModels(kind) {
  const list = modelDefs.filter((d) => d.kind === kind).map(resolve).filter(Boolean);
  const preferred = process.env.AI_PREFERRED_PROVIDER;
  return preferred ? [...list].sort((a, b) => (b.providerId === preferred) - (a.providerId === preferred)) : list;
}

export const getModel = (id) => {
  const def = modelDefs.find((d) => d.id === id);
  return def ? resolve(def) : null;
};

export async function checkProvidersHealth() {
  return Promise.all(
    Object.values(providers).map(async (p) => {
      if (!p.isConfigured()) return { id: p.id, name: p.name, configured: false, ok: false };
      try {
        const { latencyMs } = await p.healthCheck();
        return { id: p.id, name: p.name, configured: true, ok: true, latencyMs };
      } catch (err) {
        return { id: p.id, name: p.name, configured: true, ok: false, error: err?.publicMessage || "Health check failed" };
      }
    })
  );
}
