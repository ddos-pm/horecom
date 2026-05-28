import { NextResponse } from "next/server";

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
  const secret = process.env.AMOCRM_WEBHOOK_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    const provided = auth.replace(/^Bearer\s+/i, "").trim();
    if (provided !== secret) {
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
