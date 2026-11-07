import { toolBindings } from "../../../config/tool-bindings.js";
import { getModel, providers } from "../registry.js";
import { ProviderError } from "../errors.js";
import { withRetry } from "../retry.js";
import { normalizeOptions, normalizeHistory } from "../options.js";
import { renderSystem, chatPrompt, UNTRUSTED_NOTE, wrapDocument } from "../prompt.js";
import { chunkPages, selectChunks, unpackPages } from "../../documents/text.js";

export const DOC_AI = { summaryChunkChars: 12_000, maxSummaryChunks: 8, translateChunkChars: 6_000, maxTranslateChunks: 6, qaChunkChars: 8_000, qaContextChars: 24_000 };

const range = (c) => (c.pageStart === c.pageEnd ? `p. ${c.pageStart}` : `pp. ${c.pageStart}-${c.pageEnd}`);

// loadDocumentText(assetId, uid) -> { text } | null  (injected so this file needs no Firebase)
export function createDocumentAdapter({ loadDocumentText, sleep }) {
  return {
    async submit({ job }) {
      const binding = toolBindings[job.toolSlug];
      const model = getModel(job.modelId);
      if (!binding || !model) throw new ProviderError("Tool binding or model unavailable", { code: "unavailable", publicKey: "unavailable" });

      const doc = await loadDocumentText(job.input.assetId, job.userId);
      if (!doc) throw new ProviderError("Document not found", { code: "asset_missing", publicKey: "rejected" });

      const options = normalizeOptions(binding, job.input.options);
      const usage = { inputTokens: 0, outputTokens: 0, calls: 0 };

      // Each provider call retries on its own. The whole job is then marked non-retryable, so a late failure
      // never re-runs (and re-bills) the calls that already succeeded.
      const generate = async (system, prompt, maxOutputTokens) => {
        const out = await withRetry(
          () => providers[model.providerId].generateText({ model: model.providerModel, system, prompt, maxOutputTokens }),
          { retries: 2, sleep }
        );
        usage.calls++; usage.inputTokens += out.usage?.inputTokens || 0; usage.outputTokens += out.usage?.outputTokens || 0;
        return out.text;
      };

      const pages = unpackPages(doc.text);
      let text, notice = "";
      try {
        if (binding.operation === "summarize") ({ text, notice } = await summarize({ pages, options, binding, generate }));
        else if (binding.operation === "translate") ({ text, notice } = await translate({ pages, options, generate }));
        else if (binding.operation === "qa" || binding.operation === "chat") text = await answer({ pages, job, binding, generate });
        else throw new ProviderError(`Unknown document operation ${binding.operation}`, { code: "bad_binding" });
      } catch (err) {
        err.retryable = false;
        throw err;
      }
      return { state: "succeeded", output: { text: (text + notice).slice(0, 100_000) }, usage };
    },
    async poll() { throw new Error("Document jobs are synchronous and cannot be polled."); },
  };
}

async function summarize({ pages, options, binding, generate }) {
  const chunks = chunkPages(pages, DOC_AI.summaryChunkChars);
  const used = chunks.slice(0, DOC_AI.maxSummaryChunks);
  const notice = chunks.length > used.length ? `\n\n(Note: only the first ${used.length} sections of this long document were summarized.)` : "";
  const system = `${renderSystem(binding, options)} ${UNTRUSTED_NOTE}`;
  if (used.length === 1) return { text: await generate(system, wrapDocument(used[0].text), binding.maxOutputTokens), notice };

  const partials = [];
  for (const c of used) {
    partials.push(`[${range(c)}]\n` + await generate(
      `Summarize this section of a document factually in at most 150 words. ${UNTRUSTED_NOTE}`, wrapDocument(c.text), 400));
  }
  const text = await generate(
    `${renderSystem(binding, options)} You are given section summaries of one document (with page ranges); merge them into one coherent result. Do not add facts that are not in them.`,
    partials.join("\n\n"), binding.maxOutputTokens);
  return { text, notice };
}

async function translate({ pages, options, generate }) {
  const chunks = chunkPages(pages, DOC_AI.translateChunkChars);
  const used = chunks.slice(0, DOC_AI.maxTranslateChunks);
  const notice = chunks.length > used.length ? `\n\n(Note: only the first ${used.length} sections of this long document were translated.)` : "";
  const system = `Translate the document text into ${options.targetLanguage}. Keep the meaning, tone and paragraph structure. Output only the translation. ${UNTRUSTED_NOTE}`;
  const parts = [];
  for (const c of used) parts.push(await generate(system, wrapDocument(c.text), 3000));
  return { text: parts.join("\n\n"), notice };
}

async function answer({ pages, job, binding, generate }) {
  const question = job.input.text;
  const excerpts = selectChunks(question, chunkPages(pages, DOC_AI.qaChunkChars), DOC_AI.qaContextChars);
  const context = excerpts.map((c) => `[Excerpt, ${range(c)}]\n${c.text}`).join("\n\n");
  const system = `${binding.system} ${UNTRUSTED_NOTE}`;
  const history = binding.operation === "chat" ? normalizeHistory(job.input.history) : [];
  return generate(system, `${wrapDocument(context)}\n\n${chatPrompt(history, question)}`, binding.maxOutputTokens);
}
