import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { limitRequest } from "@/lib/security/limit";
import { sameOrigin } from "@/lib/security/request";
import { validatePdfBuffer } from "@/lib/storage/validate";
import { saveBuffer, deleteAsset, StorageError } from "@/lib/storage";
import { extractDocument, DocumentError } from "@/lib/documents/extract";
import { saveDocumentText } from "@/lib/documents/store";
import { LIMITS } from "@/config/limits";

const json = (body, status = 200) => NextResponse.json(body, { status });

// Accepts one PDF, extracts its text once, and stores both. Later questions reuse the stored text.
export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "Request blocked." }, 403);
  const user = await getSessionUser();
  if (!user) return json({ error: "Please log in." }, 401);
  if (!user.emailVerified) return json({ error: "Verify your email first." }, 403);
  if (!(await limitRequest({ bucket: "upload", id: user.uid, limit: 10 })).ok) return json({ error: "Too many uploads. Try again shortly." }, 429);

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > LIMITS.maxUploadBytes + 100_000) return json({ error: "The file is too large." }, 413);

  let form;
  try { form = await request.formData(); } catch { return json({ error: "Invalid upload." }, 400); }
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") return json({ error: "No file received." }, 400);
  if (file.size > LIMITS.maxUploadBytes) return json({ error: `The file is too large (max ${Math.floor(LIMITS.maxUploadBytes / 1024 / 1024)} MB).` }, 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  const check = validatePdfBuffer(buffer, { maxBytes: LIMITS.maxUploadBytes });
  if (!check.ok) return json({ error: check.error }, 400);

  let doc;
  try { doc = await extractDocument(buffer); }
  catch (err) {
    if (err instanceof DocumentError) return json({ error: err.message }, err.status);
    console.error("[uploads/document] extract failed:", err?.message);
    return json({ error: "Could not read the PDF." }, 500);
  }

  let saved;
  try {
    saved = await saveBuffer({ uid: user.uid, kind: "upload", buffer, contentType: check.contentType });
    await saveDocumentText({ assetId: saved.id, ownerId: user.uid, text: doc.text, pageCount: doc.pageCount, totalPages: doc.totalPages, truncated: doc.truncated });
  } catch (err) {
    if (saved) await deleteAsset(saved.id, user.uid).catch(() => {}); // never keep a PDF without its text
    if (err instanceof StorageError) return json({ error: err.message }, err.status);
    console.error("[uploads/document] save failed:", err?.message);
    return json({ error: "Could not save the file." }, 500);
  }
  return json({ id: saved.id, pages: doc.pageCount, totalPages: doc.totalPages, truncated: doc.truncated }, 201);
}
