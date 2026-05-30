import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/kaspi";

/**
 * POST /api/payments/kaspi/webhook
 *
 * Receives async payment-status updates from Kaspi Pay. The request body
 * is HMAC-SHA256-signed against KASPI_WEBHOOK_SECRET and the signature is
 * passed in the `x-kaspi-signature` header. Without the secret configured
 * we accept in dev/preview so the stub flow stays testable; in production
 * a missing secret means we reject all webhooks (safer default).
 *
 * On PAID we flip the Order.paymentStatus to PAID and bump the order
 * status to PAID if it was still INVOICE_SENT/WAITING_PAYMENT/CREATED.
 *
 * Idempotency: Kaspi may retry. We key off the externalRef + invoiceId
 * combination and short-circuit if the order is already PAID.
 */

const PayloadSchema = z.object({
  externalRef: z.string(), // our Order.number
  invoiceId: z.string(),
  status: z.enum(["PAID", "FAILED", "CANCELLED"]),
  paidAmount: z.number().optional(),
  paidAt: z.string().optional(),
});

export async function POST(request: Request) {
  // Read raw body for HMAC verification — JSON.parse would lose byte
  // fidelity and the signature wouldn't match Kaspi's computation.
  const rawBody = await request.text();
  const signature = request.headers.get("x-kaspi-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[kaspi/webhook] bad signature", { len: rawBody.length, hasSig: !!signature });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", details: parsed.error.errors },
      { status: 400 },
    );
  }

  const { externalRef, invoiceId, status, paidAmount, paidAt } = parsed.data;

  const order = await prisma.order.findUnique({ where: { number: externalRef } });
  if (!order) {
    // Don't 404 — Kaspi will retry. Log and ack with 200 so they back off.
    console.warn("[kaspi/webhook] order not found, acking", { externalRef, invoiceId });
    return NextResponse.json({ ok: true, ack: true });
  }

  // Idempotent — already terminal status.
  if (order.paymentStatus === "PAID" && status === "PAID") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  if (status === "PAID") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status:
          order.status === "CREATED" ||
          order.status === "INVOICE_SENT" ||
          order.status === "WAITING_PAYMENT"
            ? "PAID"
            : order.status,
      },
    });
    console.log("[kaspi/webhook] PAID", {
      orderNumber: externalRef,
      invoiceId,
      paidAmount,
      paidAt,
    });
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: status },
    });
    console.log("[kaspi/webhook] non-paid status", { orderNumber: externalRef, status });
  }

  return NextResponse.json({ ok: true });
}
