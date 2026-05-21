-- Add new OrderStatus value (Postgres enum extension)
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DRAFT_PENDING_CONFIRMATION' BEFORE 'CREATED';

-- Add agentMetadata column on Order (for tracking MCP-initiated orders)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "agentMetadata" JSONB;

-- New McpCall log table for analytics
CREATE TABLE IF NOT EXISTS "McpCall" (
  "id" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "output" JSONB,
  "error" TEXT,
  "durationMs" INTEGER NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "McpCall_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "McpCall_toolName_createdAt_idx" ON "McpCall"("toolName", "createdAt");
CREATE INDEX IF NOT EXISTS "McpCall_createdAt_idx" ON "McpCall"("createdAt");
