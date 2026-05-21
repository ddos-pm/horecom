// V0 stub: console.log only.
// V1: replace with Resend (RESEND_API_KEY) or Supabase Edge Function with SMTP.

type OrderSummary = {
  number: string;
  total: number;
  itemCount: number;
  companyName: string;
  deliveryAddress: string;
  deliveryWindow: { date: string; slot: string };
};

export async function sendOrderConfirmation(order: OrderSummary, customerEmail: string) {
  console.log("[EMAIL STUB] → client", customerEmail, JSON.stringify(order, null, 2));
}

export async function sendOrderToManager(order: OrderSummary, customerEmail: string) {
  console.log("[EMAIL STUB] → co-founder (manager)", customerEmail, JSON.stringify(order, null, 2));
}
