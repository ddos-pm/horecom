import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Daily Vercel Cron — generates UpcomingSubscriptionOrder draft rows for
 * any SubscriptionPlan whose nextDeliveryDate falls in the next 48 hours
 * and doesn't yet have a draft for that date. For each draft we snapshot
 * current SKU prices and quantities so a later price change doesn't
 * silently alter what the customer was promised.
 *
 * The companion WhatsApp reminder lives in lib/notifications (V1 — currently
 * a console.log stub until the 360dialog API key is provisioned). This cron
 * is the source-of-truth scheduler regardless of the notification channel.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. The local
 * dev escape hatch is `?secret=<value>` so a tunnel/curl invocation works
 * without juggling headers.
 */

const LOOKAHEAD_HOURS = 48;
const CUTOFF_OFFSET_HOURS = 24;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + LOOKAHEAD_HOURS * 60 * 60 * 1000);

  const plans = await prisma.subscriptionPlan.findMany({
    where: {
      status: "ACTIVE",
      nextDeliveryDate: { gte: now, lte: windowEnd },
    },
    include: {
      company: { select: { id: true, name: true } },
      items: {
        where: { isActive: true },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              packLabel: true,
              prices: { take: 1, orderBy: { createdAt: "desc" } },
              inventorySnapshot: { select: { availableQty: true } },
            },
          },
        },
      },
      upcomingOrders: {
        where: { scheduledFor: { gte: now, lte: windowEnd } },
        select: { id: true },
      },
    },
  });

  const drafts: Array<{ planId: string; companyName: string; total: number; itemCount: number }> = [];
  let skipped = 0;

  for (const plan of plans) {
    if (plan.upcomingOrders.length > 0) {
      skipped += 1;
      continue;
    }
    const itemsSnapshot = plan.items.map((it) => {
      const price = it.product.prices[0];
      const unitPrice = price ? Number(price.basePrice.toString()) : 0;
      const qty = it.lastSuggestedQty ?? it.defaultQty;
      return {
        productId: it.product.id,
        sku: it.product.sku,
        name: it.product.name,
        packLabel: it.product.packLabel,
        quantity: qty,
        unitPrice,
        lineTotal: unitPrice * qty,
        availableQty: it.product.inventorySnapshot?.availableQty ?? 0,
      };
    });

    const estimatedTotal = itemsSnapshot.reduce((s, i) => s + i.lineTotal, 0);
    const reviewReasons: string[] = [];
    for (const i of itemsSnapshot) {
      if (i.quantity > i.availableQty) reviewReasons.push(`${i.sku}: insufficient stock`);
    }

    await prisma.upcomingSubscriptionOrder.create({
      data: {
        subscriptionPlanId: plan.id,
        status: "DRAFT",
        scheduledFor: plan.nextDeliveryDate,
        cutoffAt: new Date(plan.nextDeliveryDate.getTime() - CUTOFF_OFFSET_HOURS * 60 * 60 * 1000),
        estimatedTotal,
        reviewRequired: reviewReasons.length > 0,
        reviewReasonJson: reviewReasons.length > 0 ? { reasons: reviewReasons } : undefined,
        itemsSnapshot,
      },
    });

    drafts.push({
      planId: plan.id,
      companyName: plan.company.name,
      total: estimatedTotal,
      itemCount: itemsSnapshot.length,
    });

    // V1: send WhatsApp via 360dialog using the subscription_reminder template.
    // Stubbed today so the cron pipeline runs end-to-end without the key.
    console.log(
      `[subscription-reminder STUB] plan=${plan.id} company=${plan.company.name} ` +
        `total=${estimatedTotal} review=${reviewReasons.length > 0}`,
    );
  }

  return NextResponse.json({
    ranAt: now.toISOString(),
    plansScanned: plans.length,
    draftsCreated: drafts.length,
    skipped,
    drafts,
  });
}
