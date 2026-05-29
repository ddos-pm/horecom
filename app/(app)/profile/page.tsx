import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLocaleFromCookie } from "@/lib/locale-cookie";
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

  const [dbUser, locale] = await Promise.all([
    prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        company: { include: { addresses: { orderBy: [{ isDefault: "desc" }, { id: "asc" }] } } },
      },
    }),
    getLocaleFromCookie(),
  ]);
  if (!dbUser?.company) redirect("/onboarding");
  const isEn = locale === "en";

  return (
    <div className="container-tight space-y-4 py-6 md:py-10">
      <h1 className="text-2xl font-bold md:text-3xl">{isEn ? "Profile" : "Профиль"}</h1>

      <CompanyForm
        locale={locale}
        initial={{
          name: dbUser.company.name,
          binOrIin: dbUser.company.binOrIin,
          segment: dbUser.company.segment,
          substitutionPreference: dbUser.company.substitutionPreference,
        }}
      />

      <AddressList
        locale={locale}
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
        locale={locale}
        initial={{
          email: dbUser.email ?? user.email ?? null,
          name: dbUser.name,
          phone: dbUser.phone,
        }}
      />

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">{isEn ? "Documents" : "Документы"}</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {isEn
            ? "Terms of business and details for issuing an invoice. Horecom's full company details (BIN/IIN, IBAN, registered address) arrive on the invoice after the first order."
            : "Условия работы и реквизиты для выставления счёта. Полные реквизиты Horecom (БИН/ИИН, IBAN, юр. адрес) приходят в счёте после первого заказа."}
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href={`/${locale}/offer`}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              {isEn ? "Public offer" : "Публичная оферта"}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
          </li>
          <li>
            <Link
              href={`/${locale}/privacy`}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              {isEn ? "Privacy policy" : "Политика конфиденциальности"}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
