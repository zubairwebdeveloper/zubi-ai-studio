import { providers, getModel } from "../registry.js";
import { ProviderError } from "../errors.js";
import { toolBindings } from "../../../config/tool-bindings.js";
import { normalizeOptions, normalizeHistory } from "../options.js";
import { renderSystem, chatPrompt } from "../prompt.js";

// Text generation is synchronous at the provider, so submit() returns "succeeded" immediately.
export const textAdapter = {
  async submit({ job }) {
    const binding = toolBindings[job.toolSlug];
    const model = getModel(job.modelId);
    if (!binding || !model) {
      throw new ProviderError("Tool binding or model unavailable", { code: "unavailable", publicKey: "unavailable" });
    }
    const system = renderSystem(binding, normalizeOptions(binding, job.input.options));
    const prompt = binding.mode === "chat" ? chatPrompt(normalizeHistory(job.input.history), job.input.text) : job.input.text;
    const out = await providers[model.providerId].generateText({
      model: model.providerModel, system, prompt, maxOutputTokens: binding.maxOutputTokens,
    });
    return { state: "succeeded", output: { text: out.text.slice(0, 100_000) }, usage: out.usage };
  },
  async poll() {
    throw new Error("Text jobs are synchronous and cannot be polled.");
  },
};

export const adapters = { text: textAdapter };
