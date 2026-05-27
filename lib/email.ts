/**
 * Order notification email sender.
 *
 * Behaviour:
 *   - If RESEND_API_KEY is set → send via Resend HTTP API (no package
 *     install, raw fetch). Logs the Resend message id on success.
 *   - Else → console.log stub. Lets the order pipeline run end-to-end
 *     without external infra, and the moment the team drops the key in
 *     Vercel env, real email starts flowing — no code change.
 *
 * Sender domain: defaults to `orders@horecom.kz`. Override with
 * RESEND_FROM if the verified domain on Resend is different.
 * Manager copy goes to RESEND_MANAGER or falls back to Horecomkz@gmail.com.
 */

type OrderSummary = {
  number: string;
  total: number;
  itemCount: number;
  companyName: string;
  deliveryAddress: string;
  deliveryWindow: { date: string; slot: string };
};

const FROM = process.env.RESEND_FROM ?? "Horecom <orders@horecom.kz>";
const MANAGER_EMAIL = process.env.RESEND_MANAGER ?? "Horecomkz@gmail.com";

function formatBody(order: OrderSummary, audience: "client" | "manager"): { subject: string; html: string } {
  const totalKzt = order.total.toLocaleString("ru-RU");
  if (audience === "manager") {
    return {
      subject: `Новый заказ ${order.number} · ${totalKzt} ₸ · ${order.companyName}`,
      html: `
        <h2>Новый заказ ${order.number}</h2>
        <p><b>Компания:</b> ${order.companyName}</p>
        <p><b>Сумма:</b> ${totalKzt} ₸ · ${order.itemCount} позиций</p>
        <p><b>Доставка:</b> ${order.deliveryWindow.date} ${order.deliveryWindow.slot}</p>
        <p><b>Адрес:</b> ${order.deliveryAddress}</p>
      `,
    };
  }
  return {
    subject: `Заказ ${order.number} принят · Horecom`,
    html: `
      <h2>Заказ принят</h2>
      <p>Номер: <b>${order.number}</b></p>
      <p>Сумма: <b>${totalKzt} ₸</b> · ${order.itemCount} позиций</p>
      <p>Доставка: ${order.deliveryWindow.date} ${order.deliveryWindow.slot}</p>
      <p>Адрес: ${order.deliveryAddress}</p>
      <p>Менеджер свяжется в WhatsApp для подтверждения наличия и времени доставки.</p>
    `,
  };
}

async function sendViaResend(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error("[email] Resend send failed", r.status, text.slice(0, 200));
      return;
    }
    const data = (await r.json().catch(() => ({}))) as { id?: string };
    console.log("[email] Resend sent", { to, subject: subject.slice(0, 60), id: data.id });
  } catch (e) {
    console.error("[email] Resend network error", e instanceof Error ? e.message : "unknown");
  }
}

export async function sendOrderConfirmation(order: OrderSummary, customerEmail: string) {
  const { subject, html } = formatBody(order, "client");
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(customerEmail, subject, html);
  } else {
    console.log("[EMAIL STUB] → client", customerEmail, subject);
  }
}

export async function sendOrderToManager(order: OrderSummary, customerEmail: string) {
  const { subject, html } = formatBody(order, "manager");
  const body = `${html}<p><i>Контакт клиента:</i> ${customerEmail}</p>`;
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(MANAGER_EMAIL, subject, body);
  } else {
    console.log("[EMAIL STUB] → manager", MANAGER_EMAIL, subject);
  }
}
