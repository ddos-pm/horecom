import { NextResponse } from "next/server";
import { buildPluginManifest } from "@/lib/mcp/manifest";

/**
 * /.well-known/ai-plugin.json — convention path some AI agents probe for
 * plugin metadata. We return the same MCP manifest as
 * /api/mcp/manifest.json so a single source of truth covers both
 * discovery paths.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.json(buildPluginManifest(`${url.protocol}//${url.host}`));
}
