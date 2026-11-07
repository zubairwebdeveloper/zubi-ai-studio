import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { checkProvidersHealth } from "@/lib/ai/registry";

// Admin only. Reports which providers are configured and reachable. Never returns keys.
export async function GET() {
  const user = await getSessionUser();
  if (!user || !hasRole(user.role, "ADMIN")) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ providers: await checkProvidersHealth() }, { headers: { "Cache-Control": "no-store" } });
}
