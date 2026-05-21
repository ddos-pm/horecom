-- DropIndex
DROP INDEX IF EXISTS "User_phone_key";

-- AlterTable: add supabaseId, make phone optional
ALTER TABLE "User" ADD COLUMN "supabaseId" TEXT;
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_supabaseId_idx" ON "User"("supabaseId");
