import { authenticateApiRequest, apiJson, apiError } from "@/lib/api/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { idSchema } from "@/lib/validations/dashboard";

// GET /api/v1/jobs/{id} : status and result. Only the key owner's jobs are visible; everything else is 404.
export async function GET(request, { params }) {
  const a = await authenticateApiRequest(request);
  if (!a.ok) return a.response;
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return apiError("not_found", "Job not found.", 404);

  const snap = await getAdminDb().collection("generations").doc(id.data).get();
  if (!snap.exists || snap.data().userId !== a.auth.uid) return apiError("not_found", "Job not found.", 404);
  const g = snap.data();
  // For images, `output.assetId` is downloaded with GET /api/v1/assets/{assetId}.
  return apiJson({ id: id.data, status: g.status, tool: g.toolSlug, output: g.output, error: g.error, credits_charged: g.creditsCharged ?? null });
}
