import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp-store";
import { ratelimit, ipFromRequest } from "@/lib/ratelimit";
import { getLocaleFromCookie } from "@/lib/locale-cookie";

const BodySchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().regex(/^\d{6}$/, "invalid_code"),
});

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) return `+7${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 11) return `+${digits}`;
  return digits.startsWith("+") ? raw : `+${digits}`;
}

/**
 * POST /api/auth/otp/verify
 *
 * Verifies that the OTP code matches the one stored for this phone.
 *
 * On success: sets a short-lived http-only cookie marking the phone as
 * verified, then the client redirects to /login or /onboarding where the
 * Supabase user-bridge handles session creation.
 *
 * The Supabase admin API integration (look up existing User by phone,
 * generate a magic link, or build a custom JWT) is a follow-up step
 * tracked in CLAUDE.md Sprint 1. This skeleton stops at "phone verified"
 * so the manual login flow can be exercised end-to-end without that
 * admin-API dependency.
 */
export async function POST(request: Request) {
  const isEn = (await getLocaleFromCookie()) === "en";

  const { success } = await ratelimit.webhook.limit(`otpv:${ipFromRequest(request)}`);
  if (!success) {
    return NextResponse.json(
      { error: isEn ? "Too many attempts" : "Слишком много попыток" },
      { status: 429 },
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: isEn ? "Invalid request" : "Некорректные данные" },
      { status: 400 },
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const result = await verifyOtp(phone, parsed.data.code);

  if (!result.ok) {
    const messages: Record<string, { ru: string; en: string }> = {
      not_found: {
        ru: "Код не найден — запросите новый",
        en: "Code not found — request a new one",
      },
      expired: {
        ru: "Код устарел — запросите новый",
        en: "Code expired — request a new one",
      },
      wrong_code: {
        ru: "Неверный код",
        en: "Wrong code",
      },
      locked: {
        ru: "Слишком много неверных попыток — запросите новый код",
        en: "Too many wrong attempts — request a new code",
      },
    };
    const m = messages[result.reason];
    return NextResponse.json({ error: isEn ? m.en : m.ru, reason: result.reason }, { status: 400 });
  }

  // Mark phone as verified for the next 10 minutes via http-only cookie.
  // The client redirects to a callback that the (eventual) Supabase admin
  // bridge consumes to mint a session.
  const res = NextResponse.json({ ok: true, phone, todo: "supabase_session_bridge" });
  res.cookies.set("phone_verified", phone, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return res;
}
