import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "./form";

export const metadata = { title: "Оформление заказа" };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/checkout");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { company: { include: { addresses: true } } },
  });

  if (!dbUser?.company) redirect("/onboarding");

  return (
    <CheckoutForm
      addresses={dbUser.company.addresses.map((a) => ({
        id: a.id,
        label: a.label,
        street: a.street,
        house: a.house,
        details: a.details,
        isDefault: a.isDefault,
      }))}
      defaultSubstitutionPreference={dbUser.company.substitutionPreference}
    />
  );
}
