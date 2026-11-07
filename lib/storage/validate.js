// Pure helpers (no Firebase) so they can be tested. We trust the file's bytes, never the filename or the
// client-declared type. SVG is intentionally not allowed (it can carry scripts).
export const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
export const ALLOWED_IMAGE_TYPES = Object.keys(EXT);

export function sniffImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export function validateImageBuffer(buf, { maxBytes }) {
  if (!buf || buf.length === 0) return { ok: false, error: "The file is empty." };
  if (buf.length > maxBytes) return { ok: false, error: `The file is too large (max ${Math.floor(maxBytes / 1024 / 1024)} MB).` };
  const contentType = sniffImageType(buf);
  if (!contentType) return { ok: false, error: "Only PNG, JPEG and WebP images are supported." };
  return { ok: true, contentType };
}

// ---- PDFs (Document Studio) ----
export const DOC_EXT = { "application/pdf": "pdf" };
export const extFor = (contentType) => EXT[contentType] || DOC_EXT[contentType] || "bin";

export function sniffPdf(buf) {
  return !!buf && buf.length > 8 && buf.subarray(0, 1024).toString("latin1").includes("%PDF-");
}

export function validatePdfBuffer(buf, { maxBytes }) {
  if (!buf || buf.length === 0) return { ok: false, error: "The file is empty." };
  if (buf.length > maxBytes) return { ok: false, error: `The file is too large (max ${Math.floor(maxBytes / 1024 / 1024)} MB).` };
  if (!sniffPdf(buf)) return { ok: false, error: "Only PDF files are supported." };
  return { ok: true, contentType: "application/pdf" };
}
