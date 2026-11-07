export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === request.headers.get("host"); } catch { return false; }
}

export const clientIp = (request) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
