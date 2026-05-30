/**
 * 360dialog WhatsApp Business API client.
 *
 * Used for two things in V1:
 *   1. OTP login codes  — sendTemplate("horecom_otp", { code })
 *   2. Order notifications — sendTemplate("order_confirmed", { … }) etc.
 *
 * Behaviour:
 *   - If D360_API_KEY is set → real HTTPS call to the configured base.
 *   - Else → stub. console.log the rendered template + variables so
 *     dev/preview deploys can walk the full auth flow. Stub mode also
 *     returns the OTP code in the result (NEVER does this in live mode)
 *     so the dev's /login form can auto-fill for testing.
 *
 * Reference (locked once team registers the API key):
 *   https://docs.360dialog.com/whatsapp/sending-messages
 */

export type SendTemplateInput = {
  /** E.164 phone number (e.g., +77001234567). */
  to: string;
  /** Approved Meta template name as it appears in the 360dialog dashboard. */
  templateName: string;
  /** Language code for the template (e.g., "ru", "en", "kk"). */
  language: "ru" | "en" | "kk";
  /** Positional parameters expected by the template's {{1}}, {{2}}, … placeholders. */
  parameters: string[];
};

export type SendTemplateResult =
  | {
      ok: true;
      messageId: string;
      mode: "live" | "stub";
      /** Stub mode only: the rendered parameters (for /login dev autofill). */
      stubParameters?: string[];
    }
  | { ok: false; error: string };

function getBase(): string {
  return process.env.D360_API_BASE ?? "https://waba.360dialog.io/v1";
}

export async function sendWhatsAppTemplate(input: SendTemplateInput): Promise<SendTemplateResult> {
  const apiKey = process.env.D360_API_KEY;

  if (!apiKey) {
    const stubId = `STUB-${input.templateName}-${Date.now().toString(36)}`;
    console.log("[dialog360] STUB sendTemplate", {
      to: input.to,
      template: input.templateName,
      language: input.language,
      parameters: input.parameters,
    });
    return {
      ok: true,
      messageId: stubId,
      mode: "stub",
      stubParameters: input.parameters,
    };
  }

  try {
    const res = await fetch(`${getBase()}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "D360-API-KEY": apiKey,
      },
      body: JSON.stringify({
        to: input.to.replace(/^\+/, ""),
        type: "template",
        template: {
          name: input.templateName,
          language: { policy: "deterministic", code: input.language },
          components: [
            {
              type: "body",
              parameters: input.parameters.map((p) => ({ type: "text", text: p })),
            },
          ],
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[dialog360] send failed", res.status, text.slice(0, 200));
      return { ok: false, error: `d360_${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { messages?: Array<{ id: string }> };
    const messageId = data.messages?.[0]?.id ?? "unknown";
    return { ok: true, messageId, mode: "live" };
  } catch (e) {
    console.error("[dialog360] network error", e instanceof Error ? e.message : "unknown");
    return { ok: false, error: "d360_network_error" };
  }
}
