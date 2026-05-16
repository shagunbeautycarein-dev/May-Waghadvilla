/**
 * Safe Prisma query wrapper.
 * Catches ALL Prisma/Postgres connection errors and returns a fallback value.
 * Uses .catch() instead of try/catch to avoid Next.js error overlay picking up
 * thrown errors during React Server Component rendering.
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  fallback: T,
  silent = true
): Promise<T> {
  return queryFn().catch((err: unknown) => {
    if (!silent) {
      // Only log the error type/message, not the full stack to avoid clutter
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[DB SafeQuery] Query failed:", msg.slice(0, 200));
    }
    return fallback;
  });
}

/**
 * Check if an error is a database connection error (unreachable, timeout, etc.)
 */
export function isDbConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("p1001") ||
    msg.includes("can't reach database") ||
    msg.includes("connection") ||
    msg.includes("timeout")
  );
}
