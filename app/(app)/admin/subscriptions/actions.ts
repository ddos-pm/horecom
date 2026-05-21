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

const TargetStatus = z.enum(["ACTIVE", "PAUSED", "CANCELLED"]);

export async function changeSubscriptionStatus(
  planId: string,
  status: z.input<typeof TargetStatus>,
): Promise<Result> {
  if (!(await requireAdmin())) return { success: false, error: "Доступ только админу" };

  const parsed = TargetStatus.safeParse(status);
  if (!parsed.success) return { success: false, error: "Некорректный статус" };

  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { status: parsed.data },
  });

  revalidatePath("/admin/subscriptions");
  revalidatePath("/subscription/manage");
  return { success: true };
}
