import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logMcpCall(args: {
  toolName: string;
  input: unknown;
  output?: unknown;
  error?: string;
  durationMs: number;
  ip?: string;
  userAgent?: string;
}) {
  // Best-effort logging — never throw out of here, MCP responses must not depend on
  // analytics persistence. Errors swallowed and console'd for ops visibility.
  try {
    await prisma.mcpCall.create({
      data: {
        toolName: args.toolName,
        input: args.input as Prisma.InputJsonValue,
        output:
          args.output === undefined
            ? Prisma.JsonNull
            : (args.output as Prisma.InputJsonValue),
        error: args.error ?? null,
        durationMs: args.durationMs,
        ip: args.ip ?? null,
        userAgent: args.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[mcp] failed to log call", err);
  }
}
