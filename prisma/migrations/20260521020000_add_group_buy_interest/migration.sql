-- CreateTable
CREATE TABLE "GroupBuyInterest" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "companyId" TEXT,
  "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "processedBy" TEXT,
  CONSTRAINT "GroupBuyInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupBuyInterest_createdAt_idx" ON "GroupBuyInterest"("createdAt");
CREATE INDEX "GroupBuyInterest_companyId_idx" ON "GroupBuyInterest"("companyId");

-- AddForeignKey
ALTER TABLE "GroupBuyInterest" ADD CONSTRAINT "GroupBuyInterest_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
