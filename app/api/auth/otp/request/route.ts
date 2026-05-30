import { NextResponse } from "next/server";
import { z } from "zod";
import { issueOtp } from "@/lib/otp-store";
import { sendWhatsAppTemplate } from "@/lib/dialog360";
import { ratelimit, ipFromRequest } from "@/lib/ratelimit";
import { getLocaleFromCookie } from "@/lib/locale-cookie";

const BodySchema = z.object({
  phone: z
    .string()
    .min(8)
    .max(20)
    // Accept "+77001234567", "77001234567", with optional spaces/dashes —
    // normalize aggressively at the boundary.
    .regex(/^[+\d][\d\s\-()]+$/, "invalid_phone"),
});

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Kazakhstan numbers usually start with 7. Strip leading 8 (legacy) to 7.
  if (digits.startsWith("8") && digits.length === 11) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.startsWith("7") && digits.length === 11) {
    return `+${digits}`;
  }
  return digits.startsWith("+") ? raw : `+${digits}`;
}

/**
 * POST /api/auth/otp/request
 *
 * Generates a 6-digit OTP for the provided phone number, stores its hash
 * with a 5-minute TTL, and sends a WhatsApp template message via 360dialog.
 *
 * Rate-limited per-IP to prevent SMS-pumping attacks (the WhatsApp
 * template costs a few cents each).
 *
 * Returns a flag indicating whether 360dialog is running in stub mode so
 * the dev client can auto-fill the code from the response. NEVER returns
 * the actual code in live mode.
 */
export async function POST(request: Request) {
  const isEn = (await getLocaleFromCookie()) === "en";

  const { success } = await ratelimit.webhook.limit(`otp:${ipFromRequest(request)}`);
  if (!success) {
    return NextResponse.json(
      { error: isEn ? "Too many requests, try again later" : "Слишком много запросов, попробуйте позже" },
      { status: 429 },
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: isEn ? "Invalid phone" : "Некорректный телефон" },
      { status: 400 },
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const { code } = await issueOtp(phone);

  const tmplLang: "ru" | "en" | "kk" = isEn ? "en" : "ru";
  const r = await sendWhatsAppTemplate({
    to: phone,
    templateName: "horecom_otp",
    language: tmplLang,
    parameters: [code],
  });

  if (!r.ok) {
    return NextResponse.json(
      { error: isEn ? "Could not send code" : "Не удалось отправить код", reason: r.error },
      { status: 502 },
    );
  }

  // Stub mode only — surface the code so dev sites can auto-fill the form.
  // Production (D360_API_KEY set) returns mode:"live" without the code.
  return NextResponse.json({
    ok: true,
    mode: r.mode,
    ...(r.mode === "stub" ? { devCode: code } : {}),
  });
}
