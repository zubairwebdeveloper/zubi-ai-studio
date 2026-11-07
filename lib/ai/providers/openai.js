import { postJson, getJson } from "./http.js";
import { emptyOutputError } from "../errors.js";

const BASE = "https://api.openai.com/v1";
const headers = () => ({ Authorization: `Bearer ${process.env.OPENAI_API_KEY}` });

export const openai = {
  id: "openai",
  name: "OpenAI",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),

  async generateText({ model, system, prompt, maxOutputTokens }) {
    const data = await postJson(`${BASE}/chat/completions`, {
      headers: headers(),
      body: {
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        max_completion_tokens: maxOutputTokens,
      },
    });
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";
    if (!text.trim()) throw emptyOutputError(choice?.finish_reason || "no choices");
    return { text, usage: { inputTokens: data.usage?.prompt_tokens ?? null, outputTokens: data.usage?.completion_tokens ?? null } };
  },

  async healthCheck() {
    const t = Date.now();
    await getJson(`${BASE}/models`, { headers: headers(), timeoutMs: 10_000 });
    return { latencyMs: Date.now() - t };
  },
};
