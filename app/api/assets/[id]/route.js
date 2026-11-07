import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { sameOrigin } from "@/lib/security/request";
import { loadOwnedAsset, deleteAsset } from "@/lib/storage";
import { extFor } from "@/lib/storage/validate";
import { idSchema } from "@/lib/validations/dashboard";

const notFound = () => NextResponse.json({ error: "Not found." }, { status: 404 });

// Owner-only download. Content type comes from what we verified at upload time, never from the request.
export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return notFound();

  const asset = await loadOwnedAsset(id.data, user.uid);
  if (!asset) return notFound();

  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(new Uint8Array(asset.buffer), {
    headers: {
      "Content-Type": asset.contentType,
      "Content-Length": String(asset.buffer.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="ai-studio-${asset.id}.${extFor(asset.contentType)}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return notFound();
  return (await deleteAsset(id.data, user.uid)) ? NextResponse.json({ ok: true }) : notFound();
}
