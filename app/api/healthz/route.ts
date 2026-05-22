import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health probe for uptime monitoring + ops visibility. Reports build commit
 * (from Vercel's VERCEL_GIT_COMMIT_SHA, empty in local dev) and whether
 * the Supabase pooler is reachable.
 *
 * Stays public — no secret, no PII. Returns 200 on green, 503 on degraded
 * so external monitors trip on DB outage.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : "unknown";
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    region: process.env.VERCEL_REGION ?? "local",
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    db: { ok: dbOk, latency_ms: dbLatencyMs, error: dbError },
    response_ms: Date.now() - startedAt,
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
