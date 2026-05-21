"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type Result = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.isAdmin) return null;
  return dbUser;
}

const OrderStatusSchema = z.enum([
  "CREATED",
  "INVOICE_SENT",
  "WAITING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PARTIALLY_CONFIRMED",
  "PICKING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export async function updateOrderStatus(orderId: string, status: z.input<typeof OrderStatusSchema>): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Доступ только админу" };
  const parsed = OrderStatusSchema.safeParse(status);
  if (!parsed.success) return { success: false, error: "Некорректный статус" };

  await prisma.order.update({ where: { id: orderId }, data: { status: parsed.data } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

const ItemStatusSchema = z.enum(["PENDING", "CONFIRMED", "SUBSTITUTED", "OUT_OF_STOCK", "CANCELLED"]);

export async function updateItemStatus(itemId: string, status: z.input<typeof ItemStatusSchema>): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Доступ только админу" };
  const parsed = ItemStatusSchema.safeParse(status);
  if (!parsed.success) return { success: false, error: "Некорректный статус" };

  const item = await prisma.orderItem.update({
    where: { id: itemId },
    data: { itemStatus: parsed.data },
  });
  revalidatePath(`/admin/orders/${item.orderId}`);
  revalidatePath(`/orders/${item.orderId}`);
  return { success: true };
}

export async function proposeSubstitute(itemId: string, substituteProductId: string, reason: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Доступ только админу" };
  const substitute = await prisma.product.findUnique({ where: { id: substituteProductId } });
  if (!substitute) return { success: false, error: "Товар-замена не найден" };

  const item = await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      itemStatus: "SUBSTITUTED",
      substituteProductId,
      substituteReason: reason.trim() || null,
      substituteProposedAt: new Date(),
    },
  });
  revalidatePath(`/admin/orders/${item.orderId}`);
  return { success: true };
}
