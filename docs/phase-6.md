# Phase 6 report: Writing and Document Studio

## Live when a text provider is configured (Gemini or OpenAI; see Phase 4)
**Writing (13 tools):** Article Writer, Blog Generator, Essay Writer, SEO Content Writer, Story Writer, Press Release Generator, Email Writer, Cover Letter Generator, Product Description, Social Media Caption, Ad Copy Generator, Translator (16 target languages incl. Urdu and Roman Urdu), Research Assistant. Tone, length, platform, channel and language are options validated on the server.
**Chat:** AI Chat Assistant is now multi-turn (last 12 messages, flattened into the prompt).
**PDF (4 tools):** PDF Summarizer, PDF Translator, PDF Question Answering, Chat with PDF.

## How PDFs work
1. `POST /api/uploads/document` checks auth, origin, rate limit, size (4 MB) and the `%PDF-` signature, extracts text once with `unpdf`, and stores the file plus its text (`documentTexts`, server-only, same lifetime as the file).
2. Scanned PDFs (no selectable text) are refused with a clear message. OCR is not available yet.
3. Summarize: one call for short documents, otherwise per-section summaries then a merge (max 8 sections, about 96k characters). Translate: max 6 sections (about 36k characters). If a document is cut, the answer says so.
4. Q&A and chat use keyword retrieval (no embeddings provider is configured): only matching passages are sent, with page ranges so answers can cite pages.
5. Document text is treated as untrusted: it is wrapped in tags, the closing tag is stripped, and the system prompt says never to follow instructions found inside it.

## Honest limits
- **Research Assistant** answers from the model's own knowledge. It cannot browse, and the prompt forbids inventing sources or URLs. The UI says so. AI Web Research and AI Citation Assistant stay Coming soon (they need a search provider).
- **AI Humanizer** is intentionally not built.
- Retrieval is keyword-based: a question phrased with different words than the document may miss the right passage.
- Chat history is kept in the page only (not saved); each reply is saved to History.
- Uploads are limited to 4 MB because they pass through the server.

## Cost guards (credits still not charged until Phase 10)
Daily caps: 40 jobs, of which at most 10 image jobs and 10 document jobs (`config/limits.js`). A document job can make up to 9 provider calls. Each call retries on its own; a late failure never re-runs (or re-bills) calls that already succeeded.

## Verified (`npm run test:documents`, no network)
Page cleaning, scanned detection, packing/truncation, chunk page ranges, retrieval (relevance, order, budget, no padding with irrelevant text, Urdu tokens), option and history normalization (injected `system` turns dropped, caps), prompt building, document adapter with a fake provider (call counts per operation, truncation notices, language fallback, citations, ownership, retry behavior), PDF signature checks, binding validity, route and storage structure. The suite found and fixed one real issue: retrieval used to pad the context with irrelevant chunks. All earlier suites pass; 144 files parse; all imports resolve.

## NOT verified
- **PDF text extraction itself.** `unpdf` could not be installed here (no network), so `extractDocument` has never run on a real PDF. Test with a real text PDF, a scanned PDF, a password-protected PDF and a large one. If `unpdf`'s API differs from `getDocumentProxy` + `extractText(pdf, { mergePages: false })`, only `lib/documents/extract.js` needs changing. Check the installed version.
- Any real Gemini/OpenAI call, Firestore behavior, `next build`, the UI in a browser.
- Quality of translations/summaries, and Roman Urdu output.

## Setup
`npm install` (adds `unpdf`). No new env vars. No new Firestore index (document caps reuse the `userId, type, createdAt` index from Phase 5).
