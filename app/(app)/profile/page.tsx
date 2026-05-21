import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CompanyForm } from "./company-form";
import { ContactForm } from "./contact-form";
import { AddressList } from "./addresses";

export const metadata = { title: "Профиль" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      company: { include: { addresses: { orderBy: [{ isDefault: "desc" }, { id: "asc" }] } } },
    },
  });
  if (!dbUser?.company) redirect("/onboarding");

  return (
    <div className="container-tight space-y-4 py-6 md:py-10">
      <h1 className="text-2xl font-bold md:text-3xl">Профиль</h1>

      <CompanyForm
        initial={{
          name: dbUser.company.name,
          binOrIin: dbUser.company.binOrIin,
          segment: dbUser.company.segment,
          substitutionPreference: dbUser.company.substitutionPreference,
        }}
      />

      <AddressList
        initial={dbUser.company.addresses.map((a) => ({
          id: a.id,
          label: a.label,
          street: a.street,
          house: a.house,
          details: a.details,
          comment: a.comment,
          isDefault: a.isDefault,
        }))}
      />

      <ContactForm
        initial={{
          email: dbUser.email ?? user.email ?? null,
          name: dbUser.name,
          phone: dbUser.phone,
        }}
      />
    </div>
  );
}
