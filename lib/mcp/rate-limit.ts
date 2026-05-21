/**
 * Per-IP rate limit for MCP endpoints. 60 requests / minute / IP.
 *
 * Backed by the McpCall log table — this works across serverless function
 * instances (in-memory Maps don't, because Vercel may route every request to
 * a different cold-start worker). The cost is one extra Prisma count() per
 * call; on Supabase pooler that's ~5–15 ms which is acceptable for V0.
 *
 * In-memory hot-path is retained as a soft fast-deny: if this process has
 * already seen >60 hits from the IP in the current window, deny without a
 * DB roundtrip. The DB count is authoritative for the slow path.
 */

import { prisma } from "@/lib/prisma";

const WINDOW_MS = 60_000;
const LIMIT = 60;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export async function checkRateLimit(ip: string): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowStart = new Date(now - WINDOW_MS);

  // Fast path — same-instance bucket.
  let bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;
  if (bucket.count > LIMIT) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  // Authoritative cross-instance count from McpCall log.
  try {
    const recent = await prisma.mcpCall.count({
      where: { ip, createdAt: { gte: windowStart } },
    });
    const totalIncludingThis = recent + 1; // logger writes AFTER this check
    return {
      ok: totalIncludingThis <= LIMIT,
      remaining: Math.max(0, LIMIT - totalIncludingThis),
      resetAt: bucket.resetAt,
    };
  } catch {
    // DB unavailable — fall back to permissive (better than rejecting valid
    // traffic on a transient pooler hiccup). In-memory bucket still applies.
    return {
      ok: true,
      remaining: Math.max(0, LIMIT - bucket.count),
      resetAt: bucket.resetAt,
    };
  }
}
