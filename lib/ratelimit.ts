/**
 * Sliding-window rate limiter backed by Upstash Redis.
 *
 * Env-gated: when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * aren't set, every call returns `{ success: true }` (allow all). This
 * lets the import + call sites ship safely before the Upstash project
 * is provisioned, and means a misconfigured prod can't lock everyone
 * out of the API by accident.
 *
 * Buckets:
 *   - mcp:      public agentic MCP — 20 calls / 10s per IP. Lower than
 *               the webhook because it can hit Prisma + an LLM-shaped
 *               surface that's expensive to abuse.
 *   - webhook:  AmoCRM POSTs, can legit-burst when a manager processes
 *               many leads back-to-back — 60 / minute per IP.
 *
 * Usage at a call site:
 *   const { success } = await ratelimit.mcp.limit(ipFromRequest(req));
 *   if (!success) return NextResponse.json({ error: "..." }, { status: 429 });
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

type LimiterResult = { success: boolean; limit: number; remaining: number; reset: number };
type Limiter = { limit: (key: string) => Promise<LimiterResult> };

function makeLimiter(window: `${number} ${"s" | "m" | "h"}`, requests: number, prefix: string): Limiter {
  if (!url || !token) {
    // Permissive no-op until Upstash is configured.
    return {
      limit: async () => ({ success: true, limit: requests, remaining: requests, reset: 0 }),
    };
  }
  const rl = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix,
    analytics: true,
  });
  return { limit: (key: string) => rl.limit(key) };
}

export const ratelimit = {
  mcp: makeLimiter("10 s", 20, "horecom:rl:mcp"),
  webhook: makeLimiter("1 m", 60, "horecom:rl:webhook"),
};

/** Extracts a stable client key (CF/Vercel forward the real IP via x-forwarded-for). */
export function ipFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
