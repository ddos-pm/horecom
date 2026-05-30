"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLocaleFromCookie } from "@/lib/locale-cookie";

type Result = { success: true } | { success: false; error: string };

// Locale-aware error strings — keyed lookup keeps server-action returns
// localized without giant inline branches on every guard clause.
async function getErrors() {
  const isEn = (await getLocaleFromCookie()) === "en";
  return {
    notAuth: isEn ? "Not authorized" : "Не авторизованы",
    checkFields: isEn ? "Check the form fields" : "Проверьте поля",
    checkAddressFields: isEn ? "Check the address fields" : "Проверьте поля адреса",
    addressNotFound: isEn ? "Address not found" : "Адрес не найден",
    addressInUse: isEn
      ? "Address is referenced by orders. Cannot delete."
      : "Адрес используется в заказах. Удалить нельзя.",
  };
}

async function getCurrentDbUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.companyId) return null;
  return dbUser;
}

const CompanySchema = z.object({
  name: z.string().min(2).max(120),
  binOrIin: z.string().trim().optional().or(z.literal("")),
  substitutionPreference: z.enum(["ASK", "SAME_BRAND_ONLY", "NEVER"]),
});

export async function updateCompany(input: z.input<typeof CompanySchema>): Promise<Result> {
  const E = await getErrors();
  const dbUser = await getCurrentDbUser();
  if (!dbUser?.companyId) return { success: false, error: E.notAuth };

  const parsed = CompanySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: E.checkFields };

  await prisma.company.update({
    where: { id: dbUser.companyId },
    data: {
      name: parsed.data.name.trim(),
      binOrIin: parsed.data.binOrIin?.trim() || null,
      substitutionPreference: parsed.data.substitutionPreference,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

const ContactSchema = z.object({
  name: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
});

export async function updateContact(input: z.input<typeof ContactSchema>): Promise<Result> {
  const E = await getErrors();
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return { success: false, error: E.notAuth };

  const parsed = ContactSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: E.checkFields };

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      name: parsed.data.name?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

const AddressSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(60),
  street: z.string().min(2).max(120),
  house: z.string().min(1).max(40),
  details: z.string().max(120).optional().or(z.literal("")),
  comment: z.string().max(400).optional().or(z.literal("")),
});

export async function upsertAddress(input: z.input<typeof AddressSchema>): Promise<Result> {
  const E = await getErrors();
  const dbUser = await getCurrentDbUser();
  if (!dbUser?.companyId) return { success: false, error: E.notAuth };

  const parsed = AddressSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: E.checkAddressFields };

  const data = {
    label: parsed.data.label.trim(),
    street: parsed.data.street.trim(),
    house: parsed.data.house.trim(),
    details: parsed.data.details?.trim() || null,
    comment: parsed.data.comment?.trim() || null,
  };

  if (parsed.data.id) {
    const existing = await prisma.address.findUnique({ where: { id: parsed.data.id } });
    if (!existing || existing.companyId !== dbUser.companyId) {
      return { success: false, error: E.addressNotFound };
    }
    await prisma.address.update({ where: { id: parsed.data.id }, data });
  } else {
    const count = await prisma.address.count({ where: { companyId: dbUser.companyId } });
    await prisma.address.create({
      data: { ...data, companyId: dbUser.companyId, isDefault: count === 0 },
    });
  }

  revalidatePath("/profile");
  revalidatePath("/checkout");
  return { success: true };
}

export async function deleteAddress(id: string): Promise<Result> {
  const E = await getErrors();
  const dbUser = await getCurrentDbUser();
  if (!dbUser?.companyId) return { success: false, error: E.notAuth };

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.companyId !== dbUser.companyId) {
    return { success: false, error: E.addressNotFound };
  }

  const ordersUsingAddress = await prisma.order.count({ where: { addressId: id } });
  if (ordersUsingAddress > 0) {
    return { success: false, error: E.addressInUse };
  }

  await prisma.address.delete({ where: { id } });

  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { companyId: dbUser.companyId },
      orderBy: { id: "asc" },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  revalidatePath("/profile");
  revalidatePath("/checkout");
  return { success: true };
}

export async function setDefaultAddress(id: string): Promise<Result> {
  const E = await getErrors();
  const dbUser = await getCurrentDbUser();
  if (!dbUser?.companyId) return { success: false, error: E.notAuth };

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.companyId !== dbUser.companyId) {
    return { success: false, error: E.addressNotFound };
  }

  await prisma.$transaction([
    prisma.address.updateMany({ where: { companyId: dbUser.companyId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);

  revalidatePath("/profile");
  revalidatePath("/checkout");
  return { success: true };
}
