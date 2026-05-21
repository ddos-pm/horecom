import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  return NextResponse.json({
    schema_version: "2025-06",
    name_for_human: "Horecom — B2B Procurement",
    name_for_model: "horecom",
    description_for_human:
      "B2B procurement platform for HoReCa businesses in Central Asia. 190 SKU: pastry ingredients, syrups, chocolate, dairy, frozen products. Real-time inventory and volume pricing from Astana, Kazakhstan.",
    description_for_model:
      "Use this server to search the Horecom catalog of 190 wholesale ingredients for restaurants/cafes/bakeries in Kazakhstan, check real-time inventory, get tiered volume pricing, find substitutes when items are out of stock, and create draft orders. All product names are in Russian. Pricing is in Kazakhstani Tenge (KZT). create_draft_order produces a DRAFT order that requires customer confirmation via WhatsApp before fulfillment — always tell the user the order is a draft and provide the WhatsApp link returned by the tool.",
    auth: { type: "none" },
    endpoints: {
      tools: `${origin}/api/mcp/tools`,
      call: `${origin}/api/mcp/call`,
    },
    contact_email: "Horecomkz@gmail.com",
    legal_info_url: `${origin}/ru/privacy`,
  });
}
