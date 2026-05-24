"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

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
  const redirectTo = params.get("redirectTo") ?? "/dashboard";
  const errorParam = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "auth_failed" ? "Ссылка устарела или уже использовалась. Запросите новую." : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // If a password is provided, do a direct credential login — bypasses
    // the magic-link redirect dance entirely. Useful for the seeded test
    // account and for any returning user who set a password later.
    if (showPassword && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push(redirectTo);
      router.refresh();
      return;
    }

    // Otherwise, the original magic-link path.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="container-tight flex-1 flex flex-col items-center justify-center py-12 md:py-16">
        <div className="mx-auto max-w-md space-y-3 text-center">
          <StandaloneLogo />
          <h1 className="text-2xl font-semibold">Проверьте почту</h1>
          <p className="text-sm text-muted-foreground">
            Ссылка для входа отправлена на <b>{email}</b>. Откройте письмо и нажмите кнопку — вернётесь сюда уже залогиненным.
          </p>
          <p className="text-xs text-muted-foreground">
            Не пришло за минуту? Проверьте папку Спам. Ссылка действует 1 час.
          </p>
          <a
            href="/ru"
            className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            ← На главную
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight flex-1 flex flex-col items-center justify-center py-12 md:py-16">
      <div className="mx-auto w-full max-w-md space-y-4">
        <StandaloneLogo />
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Вход в Horecom</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Введите email — пришлём ссылку для входа. Регистрация и вход — в одном шаге.
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
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {showPassword && (
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" disabled={loading || !email || (showPassword && !password)} className="w-full">
            {loading ? (showPassword ? "Входим…" : "Отправляю…") : (showPassword ? "Войти" : "Получить ссылку")}
          </Button>
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showPassword ? "← Войти через email-ссылку" : "У меня есть пароль →"}
          </button>
        </form>
        <div className="text-center">
          <a href="/ru" className="text-sm text-muted-foreground hover:text-foreground">
            ← На главную
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
