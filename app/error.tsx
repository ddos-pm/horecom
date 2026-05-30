"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, RotateCcw } from "lucide-react";
import { useLocaleCookie } from "@/lib/use-locale-cookie";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocaleCookie();
  const isEn = locale === "en";

  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  const waText = isEn
    ? "Hello! I'm seeing an error on the Horecom site"
    : "Здравствуйте! У меня ошибка на сайте Horecom";

  return (
    <div className="container-tight flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">
          {isEn ? "Something went wrong" : "Что-то пошло не так"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEn
            ? "We already know about the error. Try reloading the page — or reach out on WhatsApp."
            : "Мы уже знаем об ошибке. Попробуйте перезагрузить страницу — или свяжитесь с нами в WhatsApp."}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            {isEn ? "Error code: " : "Код ошибки: "}
            {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            {isEn ? "Reload" : "Перезагрузить"}
          </Button>
          <a
            href={`https://api.whatsapp.com/send/?phone=77078607779&text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline">
              <MessageCircle className="h-4 w-4" />
              {isEn ? "Message on WhatsApp" : "Написать в WhatsApp"}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
