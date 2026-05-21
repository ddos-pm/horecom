"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <div className="container-tight flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Что-то пошло не так</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Мы уже знаем об ошибке. Попробуйте перезагрузить страницу — или свяжитесь с нами в WhatsApp.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">Код ошибки: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Перезагрузить
          </Button>
          <a
            href="https://api.whatsapp.com/send/?phone=77078607779&text=Здравствуйте! У меня ошибка на сайте Horecom"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline">
              <MessageCircle className="h-4 w-4" />
              Написать в WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
