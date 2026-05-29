"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useLocaleCookie } from "@/lib/use-locale-cookie";

function StandaloneLogo() {
  return (
    <div className="mb-8 flex justify-center">
      <Image
        src="/logos/logo-horizontal-transparent.png"
        alt="Horecom"
        width={569}
        height={113}
        className="h-12 w-auto md:h-14"
        unoptimized
        priority
      />
    </div>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const locale = useLocaleCookie();
  const isEn = locale === "en";
  const redirectTo = params.get("redirectTo") ?? "/dashboard";
  const errorParam = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "auth_failed"
      ? isEn
        ? "The link expired or was already used. Request a new one."
        : "Ссылка устарела или уже использовалась. Запросите новую."
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="container-tight flex-1 flex flex-col items-center justify-center py-12 md:py-16">
      <div className="mx-auto w-full max-w-md space-y-4">
        <StandaloneLogo />
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            {isEn ? "Sign in to Horecom" : "Вход в Horecom"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEn ? "Enter your email and password." : "Введите email и пароль."}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            placeholder={isEn ? "Password" : "Пароль"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" disabled={loading || !email || !password} className="w-full">
            {loading
              ? isEn
                ? "Signing in…"
                : "Входим…"
              : isEn
                ? "Sign in"
                : "Войти"}
          </Button>
        </form>
        <div className="text-center">
          <a href={`/${locale}`} className="text-sm text-muted-foreground hover:text-foreground">
            {isEn ? "← Back home" : "← На главную"}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
