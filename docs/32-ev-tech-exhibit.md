# Horecom — Technical Roadmap Exhibit (v2)
### Companion to Emergent Ventures Application | May 2026

> 1-page technical exhibit. Use as supplementary attachment to the EV application, or as raw material for technical questions during follow-up. Not a standalone proposal — read alongside the main application text.

---

## What we are building

A B2B procurement platform for HoReCa businesses in Central Asia, built around one unifying insight: **the same product catalog can power three different value modes** for three customer segments — fast wholesale ordering, predictive replenishment, and pooled group buying. No competitor in the region offers all three on one stack.

This is not a wholesale website with subscription tacked on. Subscription and group buying are architecturally distinct workspaces with their own state machines, scheduling logic, and business rules.

---

## Current operating reality (May 2026)

- **$620,000 in gross sales** over the first 14 months (~$43k/month average)
- **50+ active B2B accounts** in Astana
- **10+ small pastry shops** on recurring subscription delivery
- **50 supplier relationships**, ~5,000 unique WhatsApp customer contacts
- **76,000 Instagram followers** (audience inherited and grown from co-founder's prior business)
- **9,900 Threads followers**
- **3.05% session-to-lead conversion** on the current MVP, **90% mobile traffic**
- **Physical store** at Шамши Калдаякова 1, Astana — customers can walk in

The Tilda MVP verified the core demand. It cannot deliver the three differentiated experiences the segments need: product cards do not display prices, the catalog has no search or filters, the three segments share one undifferentiated landing page, and the delivery policy is internally inconsistent across pages. This is *the storefront that proves we should build the platform*.

---

## What the grant funds

$20,000 total. Single-line breakdown:

| Item | Amount | What it enables |
|---|---|---|
| Founder operating runway (6 months) | $12,000 | Maintain product velocity without side consulting; both co-founders are already full-time on Horecom |
| Part-time developer hire (3 months) | $5,000 | Parallel work on group buying module so it ships in V1, not V1.5 |
| Almaty pilot acquisition | $3,000 | First 20 accounts in our second city; validates beyond Astana |
| **Total** | **$20,000** | |

---

## Engineering roadmap (12 weeks to V1)

| Sprint | Weeks | Deliverable |
|---|---|---|
| 1 | 1–2 | Foundation: Next.js 15 + Prisma + WhatsApp-OTP auth via 360dialog + segment onboarding + PostHog analytics + Sentry + AI discoverability layer (`/llms.txt`, Schema.org, IndexNow) |
| 2 | 3–4 | Catalog with filters and search + Product Detail Pages with volume pricing tiers + Trust Layer (FAQ, SLA, substitution policy, partial fulfillment policy, company documents) |
| 3 | 5–6 | Order core: cart, 3-step checkout, Kaspi Pay handoff, full 10-state order machine including `PARTIALLY_CONFIRMED`, AmoCRM webhook, reorder shortcuts |
| 4 | 7–9 | **Differentiator: Subscription module (S2)** — plan creation, upcoming order workspace with cutoff visibility, edit/skip/pause always visible, predictive reorder algorithm (rolling 4-order average), WhatsApp interactive notifications, full substitution UX |
| 5 | 10–12 | Polish: admin panel, i18n (Kazakh), performance budget compliance (FCP < 1.5s on mobile 3G), returns/complaint flow |

**V1.5 (4–6 weeks after V1):** Group Buy module (S3) — threshold logic, locked group pricing, share-link mechanics, 8 explicitly modeled edge cases, urgent reorder flow

**V2:** Universal Commerce Protocol (UCP) integration for agentic commerce + MCP server (positions Horecom as AI-orderable), mobile native apps, Almaty operational expansion infrastructure, BNPL

---

## Architectural choices that signal seriousness

These are the engineering decisions that distinguish a real procurement product from another marketplace clone:

1. **Company-centric data model.** A business is one entity with many users (owner + staff). Addresses, subscriptions, and orders belong to the company, not the individual. Non-negotiable for real B2B — a kitchen with rotating staff cannot lose its subscription history when one employee leaves.

2. **Substitution as first-class concept.** Most procurement platforms silently swap out-of-stock items. Horecom never does. Substitution proposals are tracked at the line-item level, require explicit customer approval via WhatsApp or web, default to rejection on timeout, and override auto-approval if price delta exceeds 5%.

3. **Predictive replenishment with cold-start handling.** New subscriptions use a safe default cadence (weekly, Monday morning) until two successful deliveries establish a baseline. After that, a rolling-average algorithm predicts the next delivery and triggers a WhatsApp confirmation 48 hours ahead with interactive buttons (Confirm / Edit / Skip).

4. **Group buying with locked economics.** When a group is created, the wholesale price is fixed for all participants regardless of supplier price changes. Horecom absorbs the price-movement risk during the group window. This is what makes the offer trustworthy, not a marketing gimmick.

5. **WhatsApp template governance built in.** All transactional WhatsApp messages flow through Meta-approved templates with explicit approval state tracking. Avoids the production failure mode where templates get rejected mid-flight.

6. **Machine-readable discoverability from day one.** `/llms.txt`, full Schema.org product markup, dedicated public pages for procurement logic, and AI-crawler permissions in `robots.txt` — designed so ChatGPT, Perplexity, and Claude search route HoReCa operators to Horecom when they ask "where to buy Barry Callebaut wholesale in Astana." Costs almost nothing and compounds significantly over the grant period.

---

## What we will know in 6 months

Concrete falsifiable predictions, against which the grant should be measured:

- **200+ active accounts** (4x current)
- **Measured D30 subscription retention > 70%** — currently 10+ subscribers but retention not yet systematically tracked (will be a V1 metric)
- **Time to first order < 24 hours** from registration
- **Activation rate S1 > 60%, S2 > 40%** — i.e., signups in each segment reach their first useful action (cart for S1, subscription plan for S2)
- **First 20 paying accounts in Almaty**

Failure modes that would falsify the thesis:
- Subscription D30 < 50% → predictive value is weaker than the manual WhatsApp channel
- Average order value drops below $60 → platform may be lowering effective price discipline
- Time-to-first-order > 72h → onboarding friction defeats segment-first design

If targets are met, the next round of capital is for Almaty operational footprint and onboarding the first 10 supplier accounts in the region — not for more product engineering. The product is designed to scale before more capital is needed.

---

## Co-founder team

> Founder bios redacted from the public repository. See the EV submission
> for the full team description.

---

## Risk reductions already baked into the spec

The full technical specification explicitly closes 13 gaps that neither of two independent expert reviews caught, including: inventory data source tracking, refund flow design, WhatsApp template approval governance, Kazakhstan PDPL compliance, mobile push delivery limitations on iOS, performance budget for 1000+ SKU catalog, multi-language search, and admin operational workflows.

This is engineering discipline applied before code is written. It is the cheapest insurance against the most common failure mode of grant-funded products: shipping the first version of something nobody can operate.

---

*Supporting materials available on request: full Product Requirements Document, UX/UI specification with state matrices, Prisma schema, API contracts, benchmark research, AI discoverability implementation kit, substitution UX flow specification.*
