import "server-only";
import { DOC_LIMITS, normalizePages, assessExtraction, packPages } from "@/lib/documents/text";

export class DocumentError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// Extracts selectable text page by page using `unpdf` (a serverless-friendly PDF.js build).
// Scanned PDFs have no selectable text and are refused: OCR is not available yet.
export async function extractDocument(buffer) {
  let pages;
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: false });
    pages = Array.isArray(text) ? text : [String(text)];
  } catch (err) {
    console.error("[documents] PDF extraction failed:", err?.message); // logs a missing 'unpdf' install too
    throw new DocumentError("This PDF could not be read. It may be password-protected or damaged.");
  }
  pages = normalizePages(pages);
  const check = assessExtraction(pages);
  if (!check.ok) {
    throw new DocumentError(
      check.reason === "scanned"
        ? "This PDF has no selectable text (it looks scanned). OCR is not available yet."
        : "This PDF has no pages with text."
    );
  }
  return packPages(pages, { maxPages: DOC_LIMITS.maxPages, maxChars: DOC_LIMITS.maxChars });
}
