import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation, sendOrderToManager } from "@/lib/email";
import { pushOrderToAmoCRM } from "@/lib/amocrm";

const ItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const Body = z.object({
  items: z.array(ItemSchema).min(1),
  addressId: z.string(),
  deliveryDate: z.string(),
  deliverySlot: z.enum(["09:00-12:00", "12:30-15:30", "16:00-19:00"]),
  substitutionPreference: z.enum(["ASK", "SAME_BRAND_ONLY", "NEVER"]),
  comment: z.string().max(500).optional(),
});

const MIN_ORDER_TOTAL = 5_000;
const FREE_DELIVERY_THRESHOLD = 20_000;
const DELIVERY_FEE = 1_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизованы" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.companyId) {
    return NextResponse.json({ error: "Сначала пройдите онбординг" }, { status: 400 });
  }

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const { items, addressId, deliveryDate, deliverySlot, substitutionPreference, comment } = parsed.data;

  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.companyId !== dbUser.companyId) {
    return NextResponse.json({ error: "Адрес не найден" }, { status: 404 });
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { prices: { take: 1 } },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Некоторые товары больше не активны" }, { status: 400 });
  }

  const orderItems = items.map((i) => {
    const product = products.find((p) => p.id === i.productId)!;
    const unitPrice = Number(product.prices[0]?.basePrice ?? 0);
    return {
      productId: product.id,
      productNameSnapshot: product.name,
      unitLabelSnapshot: product.prices[0]?.unitLabel ?? product.packLabel,
      quantity: i.quantity,
      unitPrice,
      lineTotal: unitPrice * i.quantity,
    };
  });

  const subtotal = orderItems.reduce((s, i) => s + i.lineTotal, 0);
  if (subtotal < MIN_ORDER_TOTAL) {
    return NextResponse.json(
      { error: `Минимальный заказ — ${MIN_ORDER_TOTAL.toLocaleString("ru-RU")} ₸` },
      { status: 400 },
    );
  }
  const deliveryCost = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryCost;

  const number = `HC-${Date.now().toString().slice(-8)}`;

  const order = await prisma.order.create({
    data: {
      number,
      companyId: dbUser.companyId,
      addressId: address.id,
      status: "CREATED",
      paymentStatus: "PENDING",
      fulfillmentStatus: "PENDING",
      deliveryWindow: { date: deliveryDate, slot: deliverySlot, deliveryFee: deliveryCost },
      subtotal,
      total,
      substitutionPreference,
      comment: comment ?? null,
      source: "WEB",
      items: { create: orderItems },
    },
    include: { company: true, address: true },
  });

  await prisma.company.update({
    where: { id: dbUser.companyId },
    data: { substitutionPreference },
  });

  const summary = {
    number: order.number,
    total: Number(order.total),
    itemCount: orderItems.length,
    companyName: order.company.name,
    deliveryAddress: `${address.street}, ${address.house}${address.details ? `, ${address.details}` : ""}`,
    deliveryWindow: { date: deliveryDate, slot: deliverySlot },
  };

  await sendOrderConfirmation(summary, dbUser.email ?? user.email ?? "");
  await sendOrderToManager(summary, dbUser.email ?? user.email ?? "");

  // Fire-and-forget AmoCRM push. We do NOT await — order creation must
  // not block on a downstream CRM, and if the env vars aren't set yet
  // the push no-ops with a log line. When the team provisions AMOCRM_*
  // on Vercel this starts feeding his pipeline automatically.
  pushOrderToAmoCRM({
    orderNumber: order.number,
    total: Number(order.total),
    companyName: order.company.name,
    customerEmail: dbUser.email ?? user.email ?? null,
    customerPhone: dbUser.phone,
    items: orderItems.map((i) => ({
      name: i.productNameSnapshot,
      quantity: i.quantity,
      unitLabel: i.unitLabelSnapshot,
    })),
    deliveryDate,
    deliverySlot,
    deliveryAddress: `${address.street}, ${address.house}${address.details ? `, ${address.details}` : ""}`,
    substitutionPreference,
  }).catch(() => {
    // already logged inside pushOrderToAmoCRM; swallow to keep the
    // response path clean.
  });

  return NextResponse.json({ orderId: order.id, number: order.number });
}
