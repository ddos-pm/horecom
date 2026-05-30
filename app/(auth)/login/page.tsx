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

type Mode = "password" | "otp";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const locale = useLocaleCookie();
  const isEn = locale === "en";
  const redirectTo = params.get("redirectTo") ?? "/dashboard";
  const errorParam = params.get("error");
  const [mode, setMode] = useState<Mode>("password");

  const [error, setError] = useState<string | null>(
    errorParam === "auth_failed"
      ? isEn
        ? "The link expired or was already used. Request a new one."
        : "Ссылка устарела или уже использовалась. Запросите новую."
      : null,
  );

  return (
    <div className="container-tight flex-1 flex flex-col items-center justify-center py-12 md:py-16">
      <div className="mx-auto w-full max-w-md space-y-4">
        <StandaloneLogo />
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            {isEn ? "Sign in to Horecom" : "Вход в Horecom"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "password"
              ? isEn
                ? "Enter your email and password."
                : "Введите email и пароль."
              : isEn
                ? "We'll send a one-time code to your WhatsApp."
                : "Отправим одноразовый код в WhatsApp."}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-md bg-muted p-0.5 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError(null);
            }}
            className={`flex-1 rounded px-2 py-1.5 ${
              mode === "password" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {isEn ? "Email" : "Email"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setError(null);
            }}
            className={`flex-1 rounded px-2 py-1.5 ${
              mode === "otp" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {isEn ? "WhatsApp OTP" : "WhatsApp OTP"}
          </button>
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {mode === "password" ? (
          <PasswordForm
            isEn={isEn}
            redirectTo={redirectTo}
            onError={setError}
            onSuccess={() => {
              router.push(redirectTo);
              router.refresh();
            }}
          />
        ) : (
          <OtpForm isEn={isEn} onError={setError} />
        )}

        <div className="text-center">
          <a href={`/${locale}`} className="text-sm text-muted-foreground hover:text-foreground">
            {isEn ? "← Back home" : "← На главную"}
          </a>
        </div>
      </div>
    </div>
  );
}

function PasswordForm({
  isEn,
  onError,
  onSuccess,
}: {
  isEn: boolean;
  redirectTo: string;
  onError: (m: string | null) => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      onError(error.message);
      setLoading(false);
      return;
    }
    onSuccess();
  }

  return (
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
      <Button type="submit" size="lg" disabled={loading || !email || !password} className="w-full">
        {loading ? (isEn ? "Signing in…" : "Входим…") : isEn ? "Sign in" : "Войти"}
      </Button>
    </form>
  );
}

function OtpForm({ isEn, onError }: { isEn: boolean; onError: (m: string | null) => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; mode?: string; devCode?: string };
      if (!res.ok || !data.ok) {
        onError(data.error ?? (isEn ? "Could not send code" : "Не удалось отправить код"));
        return;
      }
      setStage("code");
      if (data.mode === "stub" && data.devCode) {
        // Dev convenience: 360dialog creds not configured → show the code.
        setCode(data.devCode);
        setInfo(
          isEn
            ? `Dev stub: code is ${data.devCode}`
            : `Dev-режим: код ${data.devCode}`,
        );
      } else {
        setInfo(
          isEn
            ? "Code sent to your WhatsApp."
            : "Код отправлен в WhatsApp.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        onError(data.error ?? (isEn ? "Wrong code" : "Неверный код"));
        return;
      }
      setInfo(
        isEn
          ? "Phone verified. Supabase session bridge is wired up in Sprint 1 — for now contact support to finish login."
          : "Телефон подтверждён. Бридж к Supabase-сессии включается в Sprint 1 — пока свяжитесь с менеджером, чтобы закончить вход.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (stage === "phone") {
    return (
      <form onSubmit={requestCode} className="space-y-3">
        <input
          type="tel"
          inputMode="tel"
          placeholder="+7 707 ..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoFocus
          autoComplete="tel"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" size="lg" disabled={loading || phone.replace(/\D/g, "").length < 10} className="w-full">
          {loading ? (isEn ? "Sending…" : "Отправляю…") : isEn ? "Send code" : "Отправить код"}
        </Button>
        {info && <p className="text-xs text-muted-foreground text-center">{info}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-3">
      {info && <p className="text-xs text-muted-foreground text-center">{info}</p>}
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{6}"
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        required
        autoFocus
        autoComplete="one-time-code"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Button type="submit" size="lg" disabled={loading || code.length !== 6} className="w-full">
        {loading ? (isEn ? "Verifying…" : "Проверяю…") : isEn ? "Verify" : "Проверить"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setStage("phone");
          setCode("");
          setInfo(null);
        }}
        className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        {isEn ? "← Change phone" : "← Изменить телефон"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
