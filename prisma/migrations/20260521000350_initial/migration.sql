-- CreateEnum
CREATE TYPE "Segment" AS ENUM ('ENTERPRISE', 'SMB_REPLENISHMENT', 'MICRO_GROUPBUY');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'INVOICE_SENT', 'WAITING_PAYMENT', 'PAID', 'CONFIRMED', 'PARTIALLY_CONFIRMED', 'PICKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SUBSTITUTED', 'OUT_OF_STOCK', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'REVIEW_REQUIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CadenceType" AS ENUM ('WEEKLY', 'TWICE_WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GroupBuyStatus" AS ENUM ('OPEN', 'THRESHOLD_REACHED', 'CLOSED_SUCCESS', 'CLOSED_FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FallbackMode" AS ENUM ('SOLO_PURCHASE', 'REFUND', 'WAIT_NEXT_WINDOW');

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('STANDARD', 'SUBSCRIPTION', 'GROUP');

-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('AMBIENT', 'REFRIGERATED', 'FROZEN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INVOICE', 'CONSIGNMENT_NOTE', 'RECEIPT', 'CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('ORDER_CONFIRMED', 'ORDER_DELIVERED', 'SUBSCRIPTION_REMINDER', 'SUBSCRIPTION_REVIEW_REQUIRED', 'GROUP_THRESHOLD_REACHED', 'GROUP_FAILED', 'PRICE_CHANGED', 'STOCK_ALERT', 'SUBSTITUTION_REVIEW');

-- CreateEnum
CREATE TYPE "TemplateApprovalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InventoryUpdateSource" AS ENUM ('MANUAL_ADMIN', 'SUPPLIER_WEBHOOK', 'SCHEDULED_POLL', 'ORDER_DEDUCTION');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessType" TEXT,
    "segment" "Segment" NOT NULL,
    "binOrIin" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Astana',
    "preferredDeliveryWindows" JSONB,
    "substitutionPreference" TEXT NOT NULL DEFAULT 'ASK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Astana',
    "street" TEXT NOT NULL,
    "house" TEXT NOT NULL,
    "details" TEXT,
    "comment" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKz" TEXT,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKz" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "descriptionKz" TEXT,
    "brand" TEXT,
    "imageUrl" TEXT,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryId" TEXT NOT NULL,
    "storageType" "StorageType" NOT NULL DEFAULT 'AMBIENT',
    "unitType" TEXT NOT NULL,
    "packLabel" TEXT NOT NULL,
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "isGroupEligible" BOOLEAN NOT NULL DEFAULT false,
    "isSubscriptionEligible" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "availableQty" INTEGER NOT NULL DEFAULT 0,
    "stockStatus" "StockStatus" NOT NULL,
    "source" "InventoryUpdateSource" NOT NULL DEFAULT 'MANUAL_ADMIN',
    "sourceRef" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "oldPrice" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'KZT',
    "unitLabel" TEXT NOT NULL,
    "wholesaleThreshold" INTEGER,
    "wholesalePrice" DECIMAL(12,2),
    "groupPrice" DECIMAL(12,2),
    "groupThreshold" INTEGER,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "sessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceAtAdd" DECIMAL(12,2) NOT NULL,
    "pricingMode" "PricingMode" NOT NULL DEFAULT 'STANDARD',
    "warningsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "fulfillmentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "deliveryWindow" JSONB NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "pricingModeSummary" JSONB,
    "paymentHandoffRef" TEXT,
    "substitutionPreference" TEXT NOT NULL DEFAULT 'ASK',
    "comment" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "unitLabelSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "itemStatus" "ItemStatus" NOT NULL DEFAULT 'PENDING',
    "substituteProductId" TEXT,
    "substituteReason" TEXT,
    "substituteProposedAt" TIMESTAMP(3),
    "substituteApprovedAt" TIMESTAMP(3),
    "substituteApprovedBy" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "cadenceType" "CadenceType" NOT NULL,
    "customCadenceJson" JSONB,
    "nextDeliveryDate" TIMESTAMP(3) NOT NULL,
    "cutoffAt" TIMESTAMP(3),
    "isColdStart" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlanItem" (
    "id" TEXT NOT NULL,
    "subscriptionPlanId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "defaultQty" INTEGER NOT NULL,
    "lastSuggestedQty" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastOrderedAt" TIMESTAMP(3),
    "avgIntervalDays" DOUBLE PRECISION,

    CONSTRAINT "SubscriptionPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpcomingSubscriptionOrder" (
    "id" TEXT NOT NULL,
    "subscriptionPlanId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "cutoffAt" TIMESTAMP(3) NOT NULL,
    "estimatedTotal" DECIMAL(12,2) NOT NULL,
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "reviewReasonJson" JSONB,
    "itemsSnapshot" JSONB NOT NULL,
    "resultOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpcomingSubscriptionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupBuyOffer" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "initiatorCompanyId" TEXT,
    "targetQty" INTEGER NOT NULL,
    "currentQty" INTEGER NOT NULL DEFAULT 0,
    "targetParticipants" INTEGER,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "soloPrice" DECIMAL(12,2) NOT NULL,
    "groupPrice" DECIMAL(12,2) NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "status" "GroupBuyStatus" NOT NULL DEFAULT 'OPEN',
    "fallbackMode" "FallbackMode" NOT NULL DEFAULT 'SOLO_PURCHASE',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "shareToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupBuyOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupBuyParticipation" (
    "id" TEXT NOT NULL,
    "groupBuyOfferId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reservedQty" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "GroupBuyParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "orderId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "templateId" TEXT,
    "payloadJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ru',
    "body" TEXT NOT NULL,
    "buttonsJson" JSONB,
    "approvalStatus" "TemplateApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "metaTemplateId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_segment_idx" ON "Company"("segment");

-- CreateIndex
CREATE INDEX "Company_city_idx" ON "Company"("city");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "Address_companyId_idx" ON "Address"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_isActive_idx" ON "Product"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_isGroupEligible_isActive_idx" ON "Product"("isGroupEligible", "isActive");

-- CreateIndex
CREATE INDEX "Product_isSubscriptionEligible_isActive_idx" ON "Product"("isSubscriptionEligible", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySnapshot_productId_key" ON "InventorySnapshot"("productId");

-- CreateIndex
CREATE INDEX "Price_productId_idx" ON "Price"("productId");

-- CreateIndex
CREATE INDEX "Cart_companyId_idx" ON "Cart"("companyId");

-- CreateIndex
CREATE INDEX "Cart_sessionId_idx" ON "Cart"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE INDEX "Order_companyId_status_idx" ON "Order"("companyId", "status");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_companyId_status_idx" ON "SubscriptionPlan"("companyId", "status");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_nextDeliveryDate_idx" ON "SubscriptionPlan"("nextDeliveryDate");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlanItem_subscriptionPlanId_productId_key" ON "SubscriptionPlanItem"("subscriptionPlanId", "productId");

-- CreateIndex
CREATE INDEX "UpcomingSubscriptionOrder_scheduledFor_status_idx" ON "UpcomingSubscriptionOrder"("scheduledFor", "status");

-- CreateIndex
CREATE INDEX "UpcomingSubscriptionOrder_cutoffAt_idx" ON "UpcomingSubscriptionOrder"("cutoffAt");

-- CreateIndex
CREATE UNIQUE INDEX "GroupBuyOffer_shareToken_key" ON "GroupBuyOffer"("shareToken");

-- CreateIndex
CREATE INDEX "GroupBuyOffer_status_deadlineAt_idx" ON "GroupBuyOffer"("status", "deadlineAt");

-- CreateIndex
CREATE INDEX "GroupBuyOffer_productId_idx" ON "GroupBuyOffer"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupBuyParticipation_groupBuyOfferId_companyId_key" ON "GroupBuyParticipation"("groupBuyOfferId", "companyId");

-- CreateIndex
CREATE INDEX "Document_orderId_idx" ON "Document"("orderId");

-- CreateIndex
CREATE INDEX "Document_companyId_idx" ON "Document"("companyId");

-- CreateIndex
CREATE INDEX "NotificationLog_companyId_idx" ON "NotificationLog"("companyId");

-- CreateIndex
CREATE INDEX "NotificationLog_status_createdAt_idx" ON "NotificationLog"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppTemplate_name_key" ON "WhatsAppTemplate"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshot" ADD CONSTRAINT "InventorySnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT "SubscriptionPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlanItem" ADD CONSTRAINT "SubscriptionPlanItem_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlanItem" ADD CONSTRAINT "SubscriptionPlanItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpcomingSubscriptionOrder" ADD CONSTRAINT "UpcomingSubscriptionOrder_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupBuyOffer" ADD CONSTRAINT "GroupBuyOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupBuyOffer" ADD CONSTRAINT "GroupBuyOffer_initiatorCompanyId_fkey" FOREIGN KEY ("initiatorCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupBuyParticipation" ADD CONSTRAINT "GroupBuyParticipation_groupBuyOfferId_fkey" FOREIGN KEY ("groupBuyOfferId") REFERENCES "GroupBuyOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupBuyParticipation" ADD CONSTRAINT "GroupBuyParticipation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WhatsAppTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
