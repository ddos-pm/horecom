"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Toggle a subscription plan between ACTIVE and PAUSED. Verifies the caller
 * owns the plan via companyId. Cancelled / review-required plans are not
 * toggleable — the manager controls those transitions in the admin panel.
 */
export async function toggleSubscriptionStatus(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Не авторизован" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.companyId) return { ok: false, error: "Профиль компании не найден" };

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || plan.companyId !== dbUser.companyId) {
    return { ok: false, error: "Подписка не найдена" };
  }

  if (plan.status !== "ACTIVE" && plan.status !== "PAUSED") {
    return { ok: false, error: "Эту подписку нельзя приостановить — обратитесь к менеджеру" };
  }

  const next = plan.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { status: next },
  });

  revalidatePath("/subscription/manage");
  return { ok: true, status: next };
}

/**
 * Cancel a subscription plan. Soft — status becomes CANCELLED, items and
 * history stay in place so /orders/[id] can still reference the plan
 * that produced an order. Only the plan owner (via companyId) can call.
 */
export async function cancelSubscription(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Не авторизован" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.companyId) return { ok: false, error: "Профиль компании не найден" };

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || plan.companyId !== dbUser.companyId) {
    return { ok: false, error: "Подписка не найдена" };
  }
  if (plan.status === "CANCELLED") {
    return { ok: true, status: "CANCELLED" as const };
  }

  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/subscription/manage");
  return { ok: true, status: "CANCELLED" as const };
}
