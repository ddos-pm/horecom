/**
 * In-memory per-IP rate limit for the MCP endpoints.
 * V0: 60 requests/minute/IP. Reset hourly. Acceptable for grant demos.
 * V1: move to Vercel KV / Edge Config when traffic justifies it.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const LIMIT = 60;

export function checkRateLimit(ip: string): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;
  return {
    ok: bucket.count <= LIMIT,
    remaining: Math.max(0, LIMIT - bucket.count),
    resetAt: bucket.resetAt,
  };
}
