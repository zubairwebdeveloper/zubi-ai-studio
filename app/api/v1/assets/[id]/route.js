import { authenticateApiRequest, apiError } from "@/lib/api/auth";
import { loadOwnedAsset } from "@/lib/storage";
import { extFor } from "@/lib/storage/validate";
import { idSchema } from "@/lib/validations/dashboard";

// GET /api/v1/assets/{id} : download an output file (for example a generated image). Owner only.
export async function GET(request, { params }) {
  const a = await authenticateApiRequest(request);
  if (!a.ok) return a.response;
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return apiError("not_found", "File not found.", 404);

  const asset = await loadOwnedAsset(id.data, a.auth.uid);
  if (!asset) return apiError("not_found", "File not found.", 404);
  return new Response(new Uint8Array(asset.buffer), {
    headers: {
      "Content-Type": asset.contentType,
      "Content-Length": String(asset.buffer.length),
      "Content-Disposition": `attachment; filename="ai-studio-${asset.id}.${extFor(asset.contentType)}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
