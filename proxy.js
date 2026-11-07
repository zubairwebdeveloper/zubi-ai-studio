import { NextResponse } from "next/server";

export function proxy(request) {
  const session = request.cookies.get("__session")?.value;

  if (!session) {
    const url = new URL("/login", request.url);

    url.searchParams.set("next", request.nextUrl.pathname);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
