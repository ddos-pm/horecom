"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const SubscriptionRequestSchema = z.object({
  productIds: z.array(z.string()).min(1).max(50),
  cadence: z.enum(["WEEKLY", "TWICE_WEEKLY", "BIWEEKLY", "MONTHLY"]),
  days: z.array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])).min(1),
  timeOfDay: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function submitSubscriptionRequest(
  input: z.input<typeof SubscriptionRequestSchema>,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Войдите чтобы оформить запрос" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.companyId) return { success: false, error: "Сначала пройдите онбординг" };

  const parsed = SubscriptionRequestSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Проверьте поля формы" };

  const products = await prisma.product.findMany({
    where: { id: { in: parsed.data.productIds }, isActive: true },
  });
  if (products.length === 0) return { success: false, error: "Выберите хотя бы один товар" };

  const notes = [
    `Дни: ${parsed.data.days.join(", ")}`,
    `Время: ${parsed.data.timeOfDay}`,
    parsed.data.notes?.trim() ? `Комментарий: ${parsed.data.notes.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const nextDeliveryDate = new Date();
  nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);

  await prisma.subscriptionPlan.create({
    data: {
      companyId: dbUser.companyId,
      status: "REVIEW_REQUIRED",
      cadenceType: parsed.data.cadence,
      nextDeliveryDate,
      isColdStart: true,
      notes,
      items: {
        create: products.map((p) => ({
          productId: p.id,
          defaultQty: p.minOrderQty,
        })),
      },
    },
  });

  revalidatePath("/subscription/manage");
  revalidatePath("/dashboard");
  return { success: true };
}
