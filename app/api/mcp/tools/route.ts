import { NextResponse } from "next/server";
import { z } from "zod";
import { TOOL_REGISTRY, TOOL_NAMES } from "@/lib/mcp/tools";

export const dynamic = "force-dynamic";

type JsonSchema = Record<string, unknown>;

// Lightweight Zod → JSON Schema converter for primitive shapes we use.
function zodToJsonSchema(schema: z.ZodTypeAny): JsonSchema {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(value);
      if (!(value instanceof z.ZodOptional) && !(value instanceof z.ZodDefault)) {
        required.push(key);
      }
    }
    return { type: "object", properties, ...(required.length ? { required } : {}) };
  }
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) {
    return zodToJsonSchema(schema._def.innerType);
  }
  if (schema instanceof z.ZodString) return { type: "string" };
  if (schema instanceof z.ZodNumber) return { type: "number" };
  if (schema instanceof z.ZodBoolean) return { type: "boolean" };
  if (schema instanceof z.ZodArray) {
    return { type: "array", items: zodToJsonSchema(schema._def.type) };
  }
  if (schema instanceof z.ZodEnum) {
    return { type: "string", enum: schema._def.values };
  }
  return {};
}

export async function GET() {
  return NextResponse.json({
    tools: TOOL_NAMES.map((name) => ({
      name,
      description: TOOL_REGISTRY[name].description,
      input_schema: zodToJsonSchema(TOOL_REGISTRY[name].schema as z.ZodTypeAny),
    })),
  });
}
