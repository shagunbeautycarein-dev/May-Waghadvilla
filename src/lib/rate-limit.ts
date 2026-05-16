const ipRequests = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;

  const record = ipRequests.get(ip);

  if (!record || now > record.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function rateLimitResponse(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const allowed = checkRateLimit(ip);

  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  return null;
}
