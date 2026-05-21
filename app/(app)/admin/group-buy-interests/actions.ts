"use server";

import { revalidatePath } from "next/cache";
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

export async function markInterestProcessed(id: string, processedBy: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Доступ только админу" };

  await prisma.groupBuyInterest.update({
    where: { id },
    data: {
      processedAt: new Date(),
      processedBy: processedBy.trim() || admin.email || admin.id,
    },
  });

  revalidatePath("/admin/group-buy-interests");
  return { success: true };
}

export async function unmarkInterestProcessed(id: string): Promise<Result> {
  if (!(await requireAdmin())) return { success: false, error: "Доступ только админу" };

  await prisma.groupBuyInterest.update({
    where: { id },
    data: { processedAt: null, processedBy: null },
  });

  revalidatePath("/admin/group-buy-interests");
  return { success: true };
}
