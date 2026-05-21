"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  segment: z.enum(["ENTERPRISE", "SMB_REPLENISHMENT", "MICRO_GROUPBUY"]),
  companyName: z.string().min(2).max(120),
  binOrIin: z.string().trim().optional().or(z.literal("")),
  addressStreet: z.string().min(2).max(120),
  addressHouse: z.string().min(1).max(40),
  addressDetails: z.string().max(120).optional().or(z.literal("")),
  addressComment: z.string().max(400).optional().or(z.literal("")),
});

export type OnboardingInput = z.input<typeof Schema>;

export async function completeOnboarding(
  input: OnboardingInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Не авторизованы" };

  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Проверьте поля формы" };
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return { success: false, error: "Пользователь не найден в БД" };
  if (dbUser.companyId) return { success: false, error: "Онбординг уже пройден" };

  const company = await prisma.company.create({
    data: {
      name: parsed.data.companyName.trim(),
      binOrIin: parsed.data.binOrIin?.trim() || null,
      segment: parsed.data.segment,
      addresses: {
        create: {
          label: "Основной",
          street: parsed.data.addressStreet.trim(),
          house: parsed.data.addressHouse.trim(),
          details: parsed.data.addressDetails?.trim() || null,
          comment: parsed.data.addressComment?.trim() || null,
          isDefault: true,
        },
      },
    },
  });

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { companyId: company.id },
  });

  return { success: true };
}
