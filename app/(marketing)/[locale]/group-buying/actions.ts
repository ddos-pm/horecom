"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  productIds: z.array(z.string()).max(50).optional(),
  message: z.string().max(500).optional().or(z.literal("")),
});

export async function submitGroupBuyInterest(
  input: z.input<typeof Schema>,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Проверьте поля формы" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const dbUser = user ? await prisma.user.findUnique({ where: { supabaseId: user.id } }) : null;

  await prisma.groupBuyInterest.create({
    data: {
      email: parsed.data.email.toLowerCase().trim(),
      phone: parsed.data.phone?.trim() || null,
      companyId: dbUser?.companyId ?? null,
      productIds: parsed.data.productIds ?? [],
      message: parsed.data.message?.trim() || null,
    },
  });

  return { success: true };
}
