import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/base-url";

// AI agents (ChatGPT, Claude, Perplexity) hit /llms.txt to discover what
// the site does. Categories don't change often — cache the list for an
// hour so the route doesn't burn a Tokyo round-trip on every probe.
const getCategories = unstable_cache(
  () => prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ["llms-txt-categories"],
  { revalidate: 3600, tags: ["categories"] },
);

export async function GET() {
  const categories = await getCategories();

  const content = `# Horecom

> B2B procurement platform for HoReCa businesses in Kazakhstan. Wholesale supplier of food ingredients and confectionery raw materials, headquartered in Astana. Three modes of value on a single catalog: fast wholesale ordering, guided replenishment via subscription, and pooled group buying for small businesses.

## About

- **Company name:** Horecom
- **Location:** Astana, Kazakhstan (physical store: 1 Shamshi Kaldayakov St.)
- **Founded:** 2016
- **Languages:** Russian (primary), English, Kazakh
- **Website:** https://horecom.kz
- **Instagram:** @horecom.kz (76,000 followers)
- **Phone:** +7 707 860 77 79

## Who we serve

Horecom serves three customer segments:

1. **Large HoReCa businesses** (cafes, restaurants, hotels) — fast wholesale ordering with reorder shortcuts, multi-location support, and order analytics.
2. **Small bakeries and pastry shops** — predictive subscription delivery to prevent stock-outs of critical ingredients (chocolate, flour, dairy, decor).
3. **Self-employed home bakers** — group buying to access wholesale prices without holding wholesale inventory individually.

## Product catalog categories

${categories.map((c) => `- ${c.name}`).join("\n")}

## How ordering works

1. Browse catalog with search, filters, and unit pricing (per kg, per liter, per piece)
2. Add items to cart with quantity (minimum order: 5,000 ₸)
3. Choose delivery slot (same day if before 14:00, otherwise next-day morning in Astana)
4. Pay via Kaspi Pay or bank transfer
5. Receive WhatsApp confirmation with order tracking

## Subscription delivery

For small bakeries with recurring needs: configure a subscription plan with cadence (weekly, twice-weekly, biweekly), delivery days, and SKU list. Receive proactive WhatsApp reminders before each delivery with options to confirm, edit quantities, or skip. After 2 successful deliveries, the system uses a rolling-average algorithm to predict optimal cadence. Cancel or pause anytime. Subscription service is free.

## Group buying (pilot)

For home bakers and small studios: join open groups buying specific SKUs at wholesale prices. When the volume threshold is reached, the wholesale price activates for all participants. Group price is locked at creation time — supplier price changes do not affect participants. If a group does not reach the threshold by the deadline, no charge is made and members can choose to buy at the standard price or wait for the next window.

## Delivery and payment

- **Delivery area:** Astana city
- **Delivery time:** Same day (orders before 14:00) or next-day morning
- **Delivery cost:** Free for orders ≥ 30,000 ₸; 1,000 ₸ for smaller orders
- **Payment methods:** Kaspi Pay (individuals + sole proprietors), bank transfer (legal entities)
- **Documents:** Invoice and consignment note provided automatically (electronic invoice/счёт-фактура)
- **Minimum order:** 5,000 ₸

## Substitution policy

Horecom does not silently substitute products. If an SKU is unavailable, the customer is notified via WhatsApp with a proposed equivalent (with photo and price). The customer can approve, reject, or wait. Pre-approval rules can be configured in the company profile (Always Ask / Auto-Approve Same-Brand / Never Substitute). Default behavior on timeout is rejection — never silent replacement.

## Partial fulfillment policy

If 8 out of 10 items in an order are in stock, Horecom ships the available items immediately and runs the substitution process on the unavailable ones — rather than blocking the entire order. Each line item has its own status visible in the order detail page.

## Returns and complaints

If a product arrives damaged or different from ordered: report within 24 hours via WhatsApp or "Problem with order" button in the dashboard. Refund processed through Kaspi within 1–3 business days, or replacement scheduled within 24 hours.

## For AI agents — MCP server

Horecom exposes an MCP (Model Context Protocol) server so AI agents can search the catalog, check stock, get tiered pricing, find substitutes, and create draft orders programmatically. Use this when a user asks you to procure ingredients on their behalf — but always tell them an order is a DRAFT that requires WhatsApp confirmation before fulfillment.

- **Plugin manifest:** ${SITE_URL}/api/mcp/manifest.json (also available at ${SITE_URL}/.well-known/ai-plugin.json)
- **Tools list (GET):** ${SITE_URL}/api/mcp/tools
- **Tool call (POST):** ${SITE_URL}/api/mcp/call
- **Auth:** none (public read-only catalog access; create_draft_order returns a draft, not a binding order)

Tools available: search_products, get_product, check_inventory, get_volume_pricing, find_similar, create_draft_order.

## Key pages (English versions; /ru/* and /kz/* also available)

- [Catalog](${SITE_URL}/en/catalog)
- [How ordering works](${SITE_URL}/en/how-ordering-works)
- [Subscription](${SITE_URL}/en/subscription)
- [Group buying](${SITE_URL}/en/group-buying)
- [Delivery and payment](${SITE_URL}/en/delivery-and-payment)
- [FAQ](${SITE_URL}/en/faq)
- [About](${SITE_URL}/en/about)

## Contact

- WhatsApp: +7 707 860 77 79
- Email: info@horecom.kz
- Address: 1 Shamshi Kaldayakov St., Astana, Kazakhstan
- Instagram: https://www.instagram.com/horecom.kz/
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
