/**
 * AI plugin manifest shared between two routes:
 *   - /api/mcp/manifest.json  — canonical MCP location, advertised in llms.txt
 *   - /.well-known/ai-plugin.json — convention some legacy AI plugin systems
 *     (older OpenAI plugin discovery, agent crawlers) probe by default.
 * Both routes return the same payload; we only define the shape in one place.
 */
export function buildPluginManifest(origin: string) {
  return {
    schema_version: "2025-06",
    name_for_human: "Horecom — B2B Procurement",
    name_for_model: "horecom",
    description_for_human:
      "B2B procurement platform for HoReCa businesses in Central Asia. 190 SKU: pastry ingredients, syrups, chocolate, dairy, frozen products. Real-time inventory and volume pricing from Astana, Kazakhstan.",
    description_for_model:
      "Use this server to search the Horecom catalog of 190 wholesale ingredients for restaurants/cafes/bakeries in Kazakhstan, check real-time inventory, get tiered volume pricing, find substitutes when items are out of stock, and create draft orders. All product names are in Russian. Pricing is in Kazakhstani Tenge (KZT). create_draft_order produces a DRAFT order that requires customer confirmation via WhatsApp before fulfillment — always tell the user the order is a draft and provide the WhatsApp link returned by the tool.",
    auth: { type: "none" as const },
    endpoints: {
      tools: `${origin}/api/mcp/tools`,
      call: `${origin}/api/mcp/call`,
      manifest: `${origin}/api/mcp/manifest.json`,
    },
    contact_email: "Horecomkz@gmail.com",
    legal_info_url: `${origin}/ru/privacy`,
  };
}
