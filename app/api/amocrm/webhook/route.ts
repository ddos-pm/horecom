import { NextResponse } from "next/server";
import { ratelimit, ipFromRequest } from "@/lib/ratelimit";

/**
 * Inbound webhook from AmoCRM.
 *
 * AmoCRM sends application/x-www-form-urlencoded payloads with a nested
 * structure like `leads[status][0][id]`, `leads[status][0][status_id]`,
 * etc. Once Daulet wires the trigger ("lead moved to Paid" → POST here)
 * we'll map status_id → Order.status and persist it.
 *
 * For now this is a logging + ack endpoint so the URL is reachable
 * (was 404 before) and Daulet can configure the trigger in Amo without
 * waiting on us. When AMOCRM_WEBHOOK_SECRET is set, requests must
 * include it via Authorization header — otherwise rejected.
 */
export async function POST(request: Request) {
  // Rate-limit by client IP. Permissive no-op until Upstash env is set —
  // see lib/ratelimit.ts. 60/min/IP is generous (matches AmoCRM bulk
  // status-change scenarios) and still kills sustained abuse.
  const rl = await ratelimit.webhook.limit(ipFromRequest(request));
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
  }

  const secret = process.env.AMOCRM_WEBHOOK_SECRET;
  if (secret) {
    // Accept the secret in any of three places — pick whichever the
    // AmoCRM integration supports (their UI varies between accounts):
    //   - Authorization: Bearer <secret>
    //   - X-Webhook-Secret: <secret>
    //   - ?token=<secret>
    const headerBearer = (request.headers.get("authorization") ?? "")
      .replace(/^Bearer\s+/i, "")
      .trim();
    const headerCustom = (request.headers.get("x-webhook-secret") ?? "").trim();
    const queryToken = new URL(request.url).searchParams.get("token") ?? "";
    if (headerBearer !== secret && headerCustom !== secret && queryToken !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: unknown = null;
  const ct = request.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      payload = await request.json();
    } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await request.formData();
      const entries: Record<string, string> = {};
      form.forEach((v, k) => {
        entries[k] = typeof v === "string" ? v : "[file]";
      });
      payload = entries;
    } else {
      const text = await request.text();
      payload = { raw: text.slice(0, 2000) };
    }
  } catch (e) {
    console.warn("[amocrm/webhook] body parse failed", e instanceof Error ? e.message : "unknown");
  }

  console.log("[amocrm/webhook] received", {
    contentType: ct,
    sample: JSON.stringify(payload).slice(0, 500),
  });

  // TODO when AmoCRM trigger lands: map leads[status][N].status_id ->
  // OrderStatus, find Order by amocrmLeadId (needs a column), update.
  return NextResponse.json({ ok: true });
}

// Also accept GET so Amo's URL-validation step (some configurations
// ping with GET first) doesn't 405.
export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST AmoCRM webhook payloads here" });
}
