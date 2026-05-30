import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { COMPANY } from "@/lib/company";
import { getLocaleFromCookie } from "@/lib/locale-cookie";

export default async function NotFound() {
  const locale = await getLocaleFromCookie();
  const isEn = locale === "en";

  return (
    <div className="container-tight flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <div className="text-5xl font-bold text-muted-foreground">404</div>
        <h1 className="mt-3 text-2xl font-semibold">
          {isEn ? "Page not found" : "Страница не найдена"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEn
            ? "The link may be outdated. Open the catalog or message us on WhatsApp — we'll help find what you need."
            : "Возможно, ссылка устарела. Откройте каталог или напишите в WhatsApp — поможем найти товар."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href={`/${locale}/catalog`}>
            <Button size="lg">{isEn ? "Open catalog" : "Открыть каталог"}</Button>
          </Link>
          <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline">
              <MessageCircle className="h-4 w-4" />
              {isEn ? "Message on WhatsApp" : "Написать в WhatsApp"}
            </Button>
          </a>
        </div>
        <Link href={`/${locale}`} className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground">
          {isEn ? "← Back home" : "← На главную"}
        </Link>
      </div>
    </div>
  );
}
