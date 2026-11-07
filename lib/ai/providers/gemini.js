import { postJson, getJson } from "./http.js";
import { emptyOutputError } from "../errors.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const headers = () => ({ "x-goog-api-key": process.env.GEMINI_API_KEY }); // header, never the URL

export const gemini = {
  id: "gemini",
  name: "Google Gemini",
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),

  async generateText({ model, system, prompt, maxOutputTokens }) {
    const name = String(model).replace(/^models\//, "");
    const data = await postJson(`${BASE}/models/${encodeURIComponent(name)}:generateContent`, {
      headers: headers(),
      body: {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens },
      },
    });
    const candidate = data.candidates?.[0];
    const text = (candidate?.content?.parts || []).map((p) => p.text || "").join("");
    if (!text.trim()) throw emptyOutputError(candidate?.finishReason || data.promptFeedback?.blockReason || "no candidates");
    return {
      text,
      usage: { inputTokens: data.usageMetadata?.promptTokenCount ?? null, outputTokens: data.usageMetadata?.candidatesTokenCount ?? null },
    };
  },

  async healthCheck() {
    const t = Date.now();
    await getJson(`${BASE}/models?pageSize=1`, { headers: headers(), timeoutMs: 10_000 });
    return { latencyMs: Date.now() - t };
  },
};
