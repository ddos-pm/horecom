import { NextResponse } from "next/server";
import { z } from "zod";
import { TOOL_REGISTRY, type ToolName, TOOL_NAMES } from "@/lib/mcp/tools";
import { checkRateLimit } from "@/lib/mcp/rate-limit";
import { logMcpCall } from "@/lib/mcp/logger";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  tool_name: z.enum(TOOL_NAMES as [string, ...string[]]),
  arguments: z.unknown(),
});

function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const userAgent = request.headers.get("user-agent") ?? undefined;

  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limit_exceeded", reset_at: new Date(rl.resetAt).toISOString() },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.errors },
      { status: 400 },
    );
  }

  const toolName = parsed.data.tool_name as ToolName;
  const tool = TOOL_REGISTRY[toolName];
  const start = Date.now();

  try {
    const result = await tool.handler(parsed.data.arguments, {
      agentName: userAgent,
      agentIp: ip,
    });
    const durationMs = Date.now() - start;
    void logMcpCall({
      toolName,
      input: parsed.data.arguments,
      output: result,
      durationMs,
      ip,
      userAgent,
    });
    return NextResponse.json({ success: true, result }, { headers: { "X-RateLimit-Remaining": String(rl.remaining) } });
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    void logMcpCall({
      toolName,
      input: parsed.data.arguments,
      error: message,
      durationMs,
      ip,
      userAgent,
    });
    return NextResponse.json({ error: "execution_error", message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    error: "method_not_allowed",
    message: "POST a body { tool_name, arguments } here. See /api/mcp/tools for the catalog.",
  }, { status: 405 });
}
