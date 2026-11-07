// Pure helpers for document text: cleaning, packing, chunking with page ranges, and keyword retrieval.
// No Firebase, no PDF library, so everything here is unit-testable.
export const DOC_LIMITS = { maxPages: 200, maxChars: 200_000, minCharsPerPage: 40 };
const PAGE_SEP = "\f";

export function normalizePages(pages) {
  return pages.map((p) => String(p ?? "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim());
}

// A scanned PDF has pages but almost no selectable text. We refuse it rather than summarize nothing.
export function assessExtraction(pages) {
  if (!pages.length) return { ok: false, reason: "empty" };
  const chars = pages.reduce((n, p) => n + p.replace(/\s/g, "").length, 0);
  return chars / pages.length < DOC_LIMITS.minCharsPerPage ? { ok: false, reason: "scanned" } : { ok: true };
}

// Joins pages with a form feed so page numbers survive storage. Caps pages and characters.
export function packPages(pages, { maxPages = DOC_LIMITS.maxPages, maxChars = DOC_LIMITS.maxChars } = {}) {
  const out = [];
  let used = 0, truncated = pages.length > maxPages;
  for (const page of pages.slice(0, maxPages)) {
    if (used + page.length > maxChars) {
      const room = maxChars - used;
      if (room > 0) out.push(page.slice(0, room));
      truncated = true;
      break;
    }
    out.push(page);
    used += page.length;
  }
  return { text: out.join(PAGE_SEP), pageCount: out.length, totalPages: pages.length, truncated };
}

export const unpackPages = (text) => String(text || "").split(PAGE_SEP);

// Splits pages into chunks of at most `size` characters, remembering which pages each chunk covers.
export function chunkPages(pages, size) {
  const chunks = [];
  let cur = null;
  const flush = () => { if (cur?.text.trim()) chunks.push(cur); cur = null; };

  pages.forEach((raw, i) => {
    const page = i + 1;
    const text = raw.trim();
    if (!text) return;
    if (text.length > size) {                       // one huge page: split it on its own
      flush();
      for (let at = 0; at < text.length; at += size) chunks.push({ text: text.slice(at, at + size), pageStart: page, pageEnd: page });
      return;
    }
    if (cur && cur.text.length + text.length + 2 > size) flush();
    if (!cur) cur = { text: "", pageStart: page, pageEnd: page };
    cur.text += (cur.text ? "\n\n" : "") + text;
    cur.pageEnd = page;
  });
  flush();
  return chunks;
}

const STOP = new Set("the a an and or of to in on for with is are was were be been it this that these those as at by from what which who whom how why when where does do did can could should would about into than then there their they them you your i we our".split(" "));
export const tokenize = (s) => (String(s).toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter((w) => w.length >= 2 && !STOP.has(w));

// Keyword retrieval (TF with an IDF-style weight). No embeddings provider is configured, so this is
// deliberately simple. Returns the best chunks in document order, within `maxChars`.
export function selectChunks(question, chunks, maxChars) {
  const q = [...new Set(tokenize(question))];
  const docs = chunks.map((c) => { const m = new Map(); for (const t of tokenize(c.text)) m.set(t, (m.get(t) || 0) + 1); return m; });
  const N = chunks.length;
  const idf = (t) => Math.log(1 + N / (1 + docs.filter((m) => m.has(t)).length));
  const scored = chunks.map((c, i) => ({ c, i, score: q.reduce((s, t) => s + (docs[i].has(t) ? (1 + Math.log(docs[i].get(t))) * idf(t) : 0), 0) }));

  // Only chunks that actually match are sent. If nothing matches, fall back to the start of the document.
  const matching = scored.filter((x) => x.score > 0);
  const ranked = matching.length ? matching.sort((a, b) => b.score - a.score || a.i - b.i) : scored;
  const picked = [];
  let used = 0;
  for (const x of ranked) {
    if (picked.length && used + x.c.text.length > maxChars) continue;
    picked.push(x); used += x.c.text.length;
    if (used >= maxChars) break;
  }
  return picked.sort((a, b) => a.i - b.i).map((x) => x.c);
}
