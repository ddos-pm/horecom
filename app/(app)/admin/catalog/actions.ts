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
  return dbUser?.isAdmin ? dbUser : null;
}

const StockSchema = z.object({
  availableQty: z.number().int().min(0),
});

export async function updateStock(productId: string, input: z.input<typeof StockSchema>): Promise<Result> {
  if (!(await requireAdmin())) return { success: false, error: "Доступ только админу" };

  const parsed = StockSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Неверное количество" };

  const stockStatus = parsed.data.availableQty === 0 ? "OUT_OF_STOCK" : parsed.data.availableQty < 10 ? "LOW_STOCK" : "IN_STOCK";

  await prisma.inventorySnapshot.upsert({
    where: { productId },
    create: {
      productId,
      availableQty: parsed.data.availableQty,
      stockStatus,
      source: "MANUAL_ADMIN",
    },
    update: {
      availableQty: parsed.data.availableQty,
      stockStatus,
      source: "MANUAL_ADMIN",
    },
  });

  revalidatePath("/admin/catalog");
  revalidatePath("/catalog");
  return { success: true };
}

const ProductPatchSchema = z.object({
  brand: z.string().max(80).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function updateProduct(productId: string, input: z.input<typeof ProductPatchSchema>): Promise<Result> {
  if (!(await requireAdmin())) return { success: false, error: "Доступ только админу" };

  const parsed = ProductPatchSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Проверьте поля" };

  await prisma.product.update({
    where: { id: productId },
    data: {
      ...(parsed.data.brand !== undefined && { brand: parsed.data.brand?.trim() || null }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
  });

  revalidatePath("/admin/catalog");
  revalidatePath("/catalog");
  revalidatePath(`/product/.*`);
  return { success: true };
}
