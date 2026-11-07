import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth } from "@/lib/firebase-admin";

export const SESSION_COOKIE = "__session";

export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionCookie) return null;

    const decodedToken = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      name: decodedToken.name || decodedToken.email?.split("@")[0] || "User",
    };
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

export async function requireUser() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return user;
}
