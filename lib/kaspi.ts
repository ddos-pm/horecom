/**
 * Kaspi Pay handoff.
 *
 * Behaviour:
 *   - If KASPI_API_KEY + KASPI_MERCHANT_ID are set → call the Kaspi Pay
 *     Business API to create an invoice and return the kaspi.kz redirect
 *     URL that the customer follows to pay.
 *   - Else → stub. Generate a deterministic fake URL so the order pipeline
 *     can run end-to-end without external credentials. The stub URL is
 *     clearly marked so it doesn't get confused for a real one in logs.
 *
 * Webhook signature verification (verifyWebhook) uses HMAC-SHA256 against
 * KASPI_WEBHOOK_SECRET. Constant-time comparison so a leaked signature
 * doesn't enable timing-attack mining of the secret.
 *
 * Reference: Kaspi Pay Business API docs available at
 * https://guide.kaspi.kz/business-payments (in production we'd lock the
 * specific endpoint/version once the merchant onboarding completes).
 */

import { createHmac, timingSafeEqual } from "crypto";

function getKaspiBase(): string {
  return process.env.KASPI_API_BASE ?? "https://kaspi.kz/api/v3/payment";
}

export type KaspiInvoiceInput = {
  orderNumber: string;
  amount: number;
  customerPhone?: string | null;
  description?: string;
  /**
   * URL the customer is sent to after payment completes. Usually the
   * order-detail page so they see the confirmation immediately.
   */
  returnUrl: string;
};

export type KaspiInvoiceResult =
  | { ok: true; paymentUrl: string; invoiceId: string; mode: "live" | "stub" }
  | { ok: false; error: string };

export async function createInvoice(input: KaspiInvoiceInput): Promise<KaspiInvoiceResult> {
  const apiKey = process.env.KASPI_API_KEY;
  const merchantId = process.env.KASPI_MERCHANT_ID;

  if (!apiKey || !merchantId) {
    // Stub mode — log and return a fake URL so the rest of the order
    // pipeline (DB updates, admin views) works in dev/preview without
    // real merchant credentials.
    const fakeId = `STUB-${input.orderNumber}-${Date.now().toString(36)}`;
    const fakeUrl = `https://kaspi.example.com/stub/${encodeURIComponent(fakeId)}?amount=${input.amount}`;
    console.log("[kaspi] STUB invoice", { orderNumber: input.orderNumber, amount: input.amount, fakeUrl });
    return { ok: true, paymentUrl: fakeUrl, invoiceId: fakeId, mode: "stub" };
  }

  try {
    const res = await fetch(`${getKaspiBase()}/invoices`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        merchantId,
        amount: Math.round(input.amount),
        externalRef: input.orderNumber,
        description: input.description ?? `Order ${input.orderNumber} · Horecom`,
        customerPhone: input.customerPhone ?? undefined,
        returnUrl: input.returnUrl,
        currency: "KZT",
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[kaspi] invoice create failed", res.status, text.slice(0, 200));
      return { ok: false, error: `kaspi_api_${res.status}` };
    }
    const data = (await res.json()) as { paymentUrl?: string; invoiceId?: string };
    if (!data.paymentUrl || !data.invoiceId) {
      return { ok: false, error: "kaspi_invalid_response" };
    }
    return { ok: true, paymentUrl: data.paymentUrl, invoiceId: data.invoiceId, mode: "live" };
  } catch (e) {
    console.error("[kaspi] network error", e instanceof Error ? e.message : "unknown");
    return { ok: false, error: "kaspi_network_error" };
  }
}

/**
 * Verify a webhook signature header against the request body using
 * HMAC-SHA256 + KASPI_WEBHOOK_SECRET. Constant-time comparison so a
 * timing attack can't be used to mine the secret.
 *
 * Returns true if the secret isn't configured AND we're in stub mode
 * (NODE_ENV !== "production") — keeps preview deploys testable. In
 * production a missing secret returns false to block unsigned webhooks.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.KASPI_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") return false;
    // Dev / preview without secret — accept so stub flows work end-to-end.
    return true;
  }

  if (!signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  let receivedBuf: Buffer;
  try {
    receivedBuf = Buffer.from(signatureHeader, "hex");
  } catch {
    return false;
  }
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
