import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { COMPANY } from "@/lib/company";

export default function NotFound() {
  return (
    <div className="container-tight flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <div className="text-5xl font-bold text-muted-foreground">404</div>
        <h1 className="mt-3 text-2xl font-semibold">Страница не найдена</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Возможно, ссылка устарела. Откройте каталог или напишите в WhatsApp — поможем найти товар.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/ru/catalog">
            <Button size="lg">Открыть каталог</Button>
          </Link>
          <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline">
              <MessageCircle className="h-4 w-4" />
              Написать в WhatsApp
            </Button>
          </a>
        </div>
        <Link href="/ru" className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← На главную
        </Link>
      </div>
    </div>
  );
}
