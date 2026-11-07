import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { limitRequest } from "@/lib/security/limit";
import { sameOrigin } from "@/lib/security/request";
import { validateImageBuffer } from "@/lib/storage/validate";
import { saveBuffer, StorageError } from "@/lib/storage";
import { LIMITS } from "@/config/limits";

const json = (body, status = 200) => NextResponse.json(body, { status });

// Accepts one image (PNG, JPEG or WebP). The type is decided from the file's bytes, not its name.
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
  const check = validateImageBuffer(buffer, { maxBytes: LIMITS.maxUploadBytes });
  if (!check.ok) return json({ error: check.error }, 400);

  try {
    const saved = await saveBuffer({ uid: user.uid, kind: "upload", buffer, contentType: check.contentType });
    return json(saved, 201);
  } catch (err) {
    if (err instanceof StorageError) return json({ error: err.message }, err.status);
    console.error("[uploads] failed:", err?.message);
    return json({ error: "Could not save the file." }, 500);
  }
}
