import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { upsertUserProfile, SuspendedError } from "@/lib/auth/profile";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/auth/session";
import { limitRequest } from "@/lib/security/limit";
import { sessionBodySchema } from "@/lib/validations/auth";

const json = (body, status = 200, headers) => NextResponse.json(body, { status, headers });

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === request.headers.get("host"); } catch { return false; }
}

function clientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// Exchange a fresh Firebase ID token for an httpOnly session cookie.
export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "Request blocked." }, 403);
  const limit = await limitRequest({ bucket: "session", id: clientIp(request), limit: 20 });
  if (!limit.ok) return json({ error: "Too many attempts. Try again shortly." }, 429, { "Retry-After": String(limit.retryAfter) });

  const body = sessionBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return json({ error: "Invalid request." }, 400);

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(body.data.idToken, true);
    // Only recent sign-ins may create a session.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) return json({ error: "Please sign in again." }, 401);

    await upsertUserProfile(decoded);
    const sessionCookie = await auth.createSessionCookie(body.data.idToken, { expiresIn: SESSION_MAX_AGE_MS });
    const res = json({ ok: true, emailVerified: !!decoded.email_verified });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });
    return res;
  } catch (err) {
    if (err instanceof SuspendedError) return json({ error: "This account is suspended. Contact support." }, 403);
    if (err?.code?.startsWith("auth/")) return json({ error: "Sign-in could not be verified." }, 401);
    console.error("[auth] session create failed:", err?.message);
    return json({ error: "Sign-in is temporarily unavailable." }, 500);
  }
}

// Log out: clear the cookie and revoke refresh tokens for that user.
export async function DELETE(request) {
  if (!sameOrigin(request)) return json({ error: "Request blocked." }, 403);
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (cookie) {
    try {
      const decoded = await getAdminAuth().verifySessionCookie(cookie);
      await getAdminAuth().revokeRefreshTokens(decoded.sub);
    } catch {}
  }
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
