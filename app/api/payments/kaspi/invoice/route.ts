import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/lib/kaspi";
import { SITE_URL } from "@/lib/base-url";
import { getLocaleFromCookie } from "@/lib/locale-cookie";
import { ratelimit } from "@/lib/ratelimit";

const BodySchema = z.object({ orderId: z.string().min(1) });

/**
 * POST /api/payments/kaspi/invoice
 *
 * Caller must be authenticated and either the owner of the order's company
 * OR an admin. Creates a Kaspi Pay invoice (or stub URL if creds aren't
 * configured), persists the handoff ref on the Order, flips the order's
 * paymentStatus to INVOICE_ISSUED, and returns the payment URL the
 * customer should follow.
 *
 * Idempotent: re-issuing for the same order returns the existing
 * paymentHandoffRef without creating a duplicate invoice.
 */
export async function POST(request: Request) {
  const isEn = (await getLocaleFromCookie()) === "en";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: isEn ? "Not authorized" : "Не авторизованы" },
      { status: 401 },
    );
  }

  // Per-user rate limit. Idempotent inside (returns existing handoff ref)
  // but the limit prevents quota-burn on the Kaspi API when a runaway
  // client retries hard.
  const { success: rlOk } = await ratelimit.invoice.limit(`user:${user.id}`);
  if (!rlOk) {
    return NextResponse.json(
      {
        error: isEn
          ? "Too many invoice requests. Try again in a few minutes."
          : "Слишком много запросов на счёт. Попробуйте через несколько минут.",
      },
      { status: 429 },
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: isEn ? "Invalid request" : "Некорректные данные" },
      { status: 400 },
    );
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.companyId && !dbUser?.isAdmin) {
    return NextResponse.json(
      { error: isEn ? "Forbidden" : "Нет доступа" },
      { status: 403 },
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { company: true },
  });
  if (!order) {
    return NextResponse.json(
      { error: isEn ? "Order not found" : "Заказ не найден" },
      { status: 404 },
    );
  }

  // Owner OR admin can issue. Non-admin owners can only act on their
  // company's orders.
  if (!dbUser.isAdmin && order.companyId !== dbUser.companyId) {
    return NextResponse.json(
      { error: isEn ? "Forbidden" : "Нет доступа" },
      { status: 403 },
    );
  }

  // Idempotent — if a handoff ref already exists, return it without
  // creating a duplicate invoice on Kaspi.
  if (order.paymentHandoffRef) {
    return NextResponse.json({
      paymentUrl: order.paymentHandoffRef,
      alreadyIssued: true,
    });
  }

  const result = await createInvoice({
    orderNumber: order.number,
    amount: Number(order.total),
    customerPhone: dbUser.phone,
    description: isEn
      ? `Order ${order.number} · Horecom`
      : `Заказ ${order.number} · Horecom`,
    returnUrl: `${SITE_URL}/orders/${order.id}?paid=true`,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: isEn ? "Could not create invoice" : "Не удалось создать счёт", reason: result.error },
      { status: 502 },
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentHandoffRef: result.paymentUrl,
      paymentStatus: "INVOICE_ISSUED",
      status: order.status === "CREATED" ? "INVOICE_SENT" : order.status,
    },
  });

  return NextResponse.json({
    paymentUrl: result.paymentUrl,
    invoiceId: result.invoiceId,
    mode: result.mode,
  });
}
