/**
 * AmoCRM lead push.
 *
 * Behaviour mirrors lib/email.ts:
 *  - If the AMOCRM_* env vars are populated, POST to the AmoCRM REST API.
 *  - If anything's missing, log once and no-op. Order creation must NEVER
 *    fail because Amo is misconfigured — the order is the customer's,
 *    Amo is a downstream replica.
 *
 * the team configures everything inside AmoCRM:
 *   - the pipeline + stages,
 *   - the Wazzup module sending WhatsApp to the contact on new lead,
 *   - the Kaspi-link follow-up.
 *
 * All we ship is "new order happened → make a lead in his pipeline".
 *
 * Required env (set on Vercel after the team provides them):
 *   AMOCRM_SUBDOMAIN          — e.g. "horecom"
 *   AMOCRM_LONG_LIVED_TOKEN   — generated in Settings → Integrations →
 *                                Profile (long-lived for server-to-server)
 *   AMOCRM_PIPELINE_ID        — numeric id of his "Заказы" pipeline
 *   AMOCRM_STAGE_NEW_ORDER    — numeric id of "Новый заказ" stage
 *
 * Optional env (gracefully skipped if absent):
 *   AMOCRM_FIELD_ORDER_NUMBER — custom field id for order number text
 *   AMOCRM_FIELD_DELIVERY_DATE — custom field id for delivery date text
 *   AMOCRM_FIELD_ITEMS        — custom field id for the items summary
 */

type AmoLeadInput = {
  orderNumber: string;
  total: number;
  companyName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  items: { name: string; quantity: number; unitLabel: string }[];
  deliveryDate: string;
  deliverySlot: string;
  deliveryAddress: string;
  substitutionPreference: string;
};

type AmoConfig = {
  subdomain: string;
  token: string;
  pipelineId: number;
  stageNewOrderId: number;
  fieldOrderNumber?: number;
  fieldDeliveryDate?: number;
  fieldItems?: number;
};

function readConfig(): AmoConfig | null {
  const subdomain = process.env.AMOCRM_SUBDOMAIN;
  const token = process.env.AMOCRM_LONG_LIVED_TOKEN;
  const pipelineId = numericEnv("AMOCRM_PIPELINE_ID");
  const stageNewOrderId = numericEnv("AMOCRM_STAGE_NEW_ORDER");
  if (!subdomain || !token || pipelineId == null || stageNewOrderId == null) {
    return null;
  }
  return {
    subdomain,
    token,
    pipelineId,
    stageNewOrderId,
    fieldOrderNumber: numericEnv("AMOCRM_FIELD_ORDER_NUMBER") ?? undefined,
    fieldDeliveryDate: numericEnv("AMOCRM_FIELD_DELIVERY_DATE") ?? undefined,
    fieldItems: numericEnv("AMOCRM_FIELD_ITEMS") ?? undefined,
  };
}

function numericEnv(key: string): number | null {
  const raw = process.env[key];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function formatItemsSummary(items: AmoLeadInput["items"]): string {
  return items
    .map((it) => `${it.name} × ${it.quantity} ${it.unitLabel}`)
    .join("\n");
}

/**
 * Push a new order as an AmoCRM lead.
 *
 * Returns the lead id when successful, `null` otherwise (config missing,
 * network error, non-2xx response). Caller treats `null` as "didn't push";
 * the order is still safe in our DB.
 */
export async function pushOrderToAmoCRM(input: AmoLeadInput): Promise<number | null> {
  const cfg = readConfig();
  if (!cfg) {
    console.log("[amocrm] config missing — skipping lead push", { order: input.orderNumber });
    return null;
  }

  const customFields: Array<{ field_id: number; values: Array<{ value: string }> }> = [];
  if (cfg.fieldOrderNumber) {
    customFields.push({ field_id: cfg.fieldOrderNumber, values: [{ value: input.orderNumber }] });
  }
  if (cfg.fieldDeliveryDate) {
    customFields.push({
      field_id: cfg.fieldDeliveryDate,
      values: [{ value: `${input.deliveryDate} · ${input.deliverySlot}` }],
    });
  }
  if (cfg.fieldItems) {
    customFields.push({ field_id: cfg.fieldItems, values: [{ value: formatItemsSummary(input.items) }] });
  }

  // AmoCRM "complex" lead create — bundles a Contact alongside the Lead so
  // a new customer doesn't need a separate pre-create round-trip. If the
  // contact already exists in Amo (matched by phone/email), Amo dedupes.
  const body = [
    {
      name: `Заказ ${input.orderNumber} · ${input.companyName}`,
      price: Math.round(input.total),
      pipeline_id: cfg.pipelineId,
      status_id: cfg.stageNewOrderId,
      custom_fields_values: customFields.length > 0 ? customFields : undefined,
      _embedded: {
        contacts: [
          {
            name: input.companyName,
            custom_fields_values: [
              ...(input.customerPhone
                ? [{ field_code: "PHONE", values: [{ value: input.customerPhone, enum_code: "WORK" }] }]
                : []),
              ...(input.customerEmail
                ? [{ field_code: "EMAIL", values: [{ value: input.customerEmail, enum_code: "WORK" }] }]
                : []),
            ],
          },
        ],
      },
    },
  ];

  try {
    const r = await fetch(`https://${cfg.subdomain}.amocrm.ru/api/v4/leads/complex`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.token}`,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error("[amocrm] lead push failed", r.status, text.slice(0, 300));
      return null;
    }
    const data = (await r.json().catch(() => [])) as Array<{ id?: number }>;
    const leadId = Array.isArray(data) ? data[0]?.id ?? null : null;
    console.log("[amocrm] lead created", { order: input.orderNumber, leadId });
    return leadId;
  } catch (e) {
    console.error("[amocrm] network error", e instanceof Error ? e.message : "unknown");
    return null;
  }
}
