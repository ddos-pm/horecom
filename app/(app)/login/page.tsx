"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/dashboard";
  const errorParam = params.get("error");
  const [email, setEmail] = useState("");
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
      <div className="container-tight py-16">
        <div className="mx-auto max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Проверьте почту</h1>
          <p className="text-sm text-muted-foreground">
            Ссылка для входа отправлена на <b>{email}</b>. Откройте письмо и нажмите кнопку — вернётесь сюда уже залогиненным.
          </p>
          <p className="text-xs text-muted-foreground">
            Не пришло за минуту? Проверьте папку Спам. Ссылка действует 1 час.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-16">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Вход в Horecom</h1>
        <p className="text-sm text-muted-foreground">
          Введите email — пришлём ссылку для входа. Регистрация и вход — в одном шаге.
        </p>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" disabled={loading || !email} className="w-full">
            {loading ? "Отправляю…" : "Получить ссылку"}
          </Button>
        </form>
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
