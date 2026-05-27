# Horecom Platform — Master Context for Claude Code

> This file is the entry point for Claude when working on this project. Read it first.

## What is this project

**Horecom** — B2B procurement platform for HoReCa businesses in Central Asia, headquartered in Astana, Kazakhstan. We currently operate at ~$43k/month GMV on a Tilda MVP with 50+ active accounts and 10+ subscription customers. This codebase is the **V1 platform** that replaces Tilda — being built to scale beyond Astana and to support the differentiated subscription + group-buy workspaces that Tilda cannot deliver.

This V1 is also the technical foundation tied to an **Emergent Ventures grant application** (Tyler Cowen, Mercatus Center, GMU). The grant proposal is at `docs/31-ev-application-proposal.md`. The grant's value is not just $20k but external signal/network — the proposal frames the platform thesis.

## Project status (May 19, 2026)

**Done (this codebase is at this state):**
- Next.js 15 + React 19 + TypeScript skeleton, builds without errors
- Full Prisma schema (Company-centric, 13 gap-closing decisions baked in)
- Seed data: 11 categories + 16 top-SKUs from current Tilda + 6 WhatsApp templates (DRAFT)
- Public pages: home (segment-first), catalog with filters, PDP with JSON-LD, FAQ, About, How-Ordering-Works, Subscription landing, Group Buying landing, Delivery, Privacy, Cart placeholder
- AI Discoverability layer: dynamic `/llms.txt`, `/robots.txt` with AI bots whitelisted, `/sitemap.xml`, Organization + WebSite + Product + Breadcrumb + FAQPage JSON-LD
- Header (with search), Footer (with contacts and trust elements)
- Design tokens via CSS variables, mobile-first

**Not done (V1 work ahead):**
- Auth (OTP via 360dialog WhatsApp Business API)
- Cart/checkout logic with Zustand
- Kaspi Pay handoff + webhook
- Order state machine UI
- Subscription workspace (the MAIN V1 differentiator)
- Substitution UX flow (spec in `docs/13-substitution-ux-spec.md`)
- AmoCRM webhook integration
- Admin panel
- Cron job for upcoming subscription orders
- i18n (Kazakh)
- Group Buy module (V1.5)

## Tech stack (non-negotiable decisions)

- **Frontend:** Next.js 15 App Router · React 19 RC · TypeScript strict
- **Styling:** Tailwind v3 + shadcn-style components (no shadcn CLI — copy the patterns)
- **Data:** Prisma 5.22 + PostgreSQL (Neon serverless)
- **Auth:** NextAuth.js v5 with OTP via WhatsApp (360dialog) — NOT SMS, this was deliberate
- **State:** Zustand for cart, TanStack Query for server state
- **Payments:** Kaspi Pay Business API (invoices + webhooks)
- **Comms:** WhatsApp Business API via 360dialog (primary), email fallback
- **CRM:** AmoCRM via webhooks
- **Hosting:** Vercel (preview branches enabled)
- **Monitoring:** Sentry + PostHog

**Important:** when installing dependencies, use `--legacy-peer-deps`:
```bash
npm install --legacy-peer-deps
```
This is required because Next.js 15 pins a specific React 19 RC version.

## Repo structure

```
horecom-platform/
├── CLAUDE.md                          ← you are here
├── README.md                          ← setup + deploy instructions
├── docs/                              ← FULL CONTEXT, READ AS NEEDED
│   ├── 10-synthesis-master.md         ← THE master synthesis doc (verdicts on every design decision)
│   ├── 11-technical-context.md        ← tech context, state machines, integrations
│   ├── 12-ai-discoverability-kit.md   ← what /llms.txt / Schema.org should look like
│   ├── 13-substitution-ux-spec.md     ← spec for substitution flow (Gap #3 closure)
│   ├── 20-product-readme.md           ← co-founder's context pack readme
│   ├── 21-company-story.md            ← who Horecom serves, segments, current MVP gaps
│   ├── 22-product-vision.md           ← 3 value-modes, V1/V1.5/V2 roadmap
│   ├── 23-traction-metrics.md         ← all current numbers ($620k, 50+ accounts, etc.)
│   ├── 24-founders-story.md           ← co-founder + co-founder + (redacted) lesson
│   ├── 25-links-index.md              ← external URLs (LinkedIn, IG, etc.)
│   ├── 26-references.md               ← EV grant references (3 people)
│   ├── 30-ev-grant-angle.md           ← strategic angle for the grant (RU)
│   ├── 31-ev-application-proposal.md  ← actual EN proposal text, 1145 words
│   └── 32-ev-tech-exhibit.md          ← 1-page technical exhibit for grant
├── app/                               ← Next.js App Router pages
├── components/                        ← React components
├── lib/                               ← utilities (prisma client, helpers)
├── prisma/
│   ├── schema.prisma                  ← Company-centric data model
│   └── seed.ts                        ← categories + SKUs + WA templates
├── public/
│   └── robots.txt                     ← AI bots whitelisted
├── .env.example                       ← env vars template
└── package.json
```

## Critical architectural decisions

These came out of a synthesis of two independent expert spec packages. The reasoning is in `docs/10-synthesis-master.md`. Do not relitigate them without re-reading that doc first.

1. **Company-centric data model.** Orders, addresses, subscriptions belong to `Company`, never to `User`. A kitchen with rotating staff must not lose its subscription history when a single employee leaves.

2. **10-state order machine.** `CREATED → INVOICE_SENT → WAITING_PAYMENT → PAID → CONFIRMED → PARTIALLY_CONFIRMED → PICKING → OUT_FOR_DELIVERY → DELIVERED → CANCELLED`. `PARTIALLY_CONFIRMED` is critical — when 8 of 10 SKUs are in stock, we ship and handle the other 2 via substitution, never block the whole order.

3. **Substitution as first-class.** Out-of-stock items are NEVER silently swapped. Customer gets a WhatsApp with a proposal (photo, price, qty). Default on timeout is rejection. Pre-approval rules at Company level: `ALWAYS_ASK | SAME_BRAND_ONLY | NEVER`. If price delta > 5%, override auto-approval and force review. See `docs/13-substitution-ux-spec.md`.

4. **Subscription has cold-start handling.** New plan defaults to weekly Monday cadence until 2+ successful deliveries establish a baseline. Then rolling-average over last 4 orders predicts next delivery. `isColdStart` flag on `SubscriptionPlan` tracks this.

5. **WhatsApp templates as DB entities.** `WhatsAppTemplate` model with `approvalStatus: DRAFT | SUBMITTED | APPROVED | REJECTED`. Templates must be APPROVED by Meta (2–7 days) before they can be sent. Production-failure mode if we hardcode templates and they get rejected mid-flight.

6. **Inventory has explicit data source tracking.** `InventorySnapshot` has `source: MANUAL_ADMIN | SUPPLIER_WEBHOOK | SCHEDULED_POLL | ORDER_DEDUCTION` + `sourceRef`. We can answer "why is this 47kg" — it matters when co-founder calls saying we promised what we don't have.

7. **Group Buy with locked pricing.** When a group is created, the wholesale price is fixed for all participants regardless of supplier price changes. Horecom absorbs the price-movement risk. This is what makes the offer trustworthy, not a marketing gimmick.

8. **AI Discoverability from day one.** `/llms.txt` is dynamic, generated from DB. Schema.org JSON-LD on every page. `robots.txt` whitelists GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc. Costs almost nothing and compounds.

9. **Segment-first onboarding.** Three segments (`ENTERPRISE`, `SMB_REPLENISHMENT`, `MICRO_GROUPBUY`) get different home page experiences. Currently the home shows all three cards; once user picks one, we should remember it (cookie) and personalize.

## Tone, copy, and design

- **B2B operational tone, not marketing fluff.** Avoid "способ улучшить качество вашей жизни". Prefer "MOQ 5 кг · в наличии 47 кг · доставка завтра до 12:00".
- **Russian primary, Kazakh secondary** for public pages. UI labels: Russian first, Kazakh added later in i18n sweep.
- **Numbers use `tabular-nums`** font feature. Prices use `formatPrice()` from `lib/utils.ts` with non-breaking space and `₸` symbol.
- **Mobile-first.** 90% of current traffic is mobile. Min 44×44 tap targets. Sticky CTAs.
- **Primary color** is teal `#0F766E` (CSS var `--primary`). Segment accents: green for S1, amber for S2, purple for S3. No bright orange — that's the demo agency's color, not Horecom's.

## Current operating metrics (for context)

- **GMV:** ~$43k/month (~$620k over first 14 months)
- **Active B2B accounts:** 50+
- **Subscribers (S2):** 10+ bakeries (D30 retention not yet measured — will be a V1 KPI)
- **Suppliers:** 50
- **WhatsApp contacts:** ~5,000
- **Instagram followers:** 76,000 (inherited from co-founder's prior (redacted) business)
- **Threads followers:** 9,900
- **Web conversion (session → lead):** 3.05%
- **Mobile traffic:** 90%
- **AOV:** ~$88

Don't make up numbers. If the answer isn't in `docs/23-traction-metrics.md`, ask the founders.

## People

- **co-founder** (CPO/co-founder) — ex Senior PM at a major mobility tech company (left 2025). (redacted). Architect of this platform. LinkedIn: ***REMOVED***
- **co-founder** (Director/co-founder) — operator. Previously ran (redacted) pastry-supply network 5+ years. Domain expert. Owns operations, suppliers, customer success.
- **Дияр** (co-founder's younger brother, 17, in Almaty) — running the EV grant application and platform development support. Active user of this codebase via Claude Code.

## Immediate next steps (priority order)

These are the work units to drive next. Pick one and complete it before starting another.

### 1. Deploy current skeleton to Vercel (30 min)
1. `git init && git add . && git commit -m "Initial V1 skeleton"`
2. Push to a private GitHub repo
3. Create Neon Postgres project at https://console.neon.tech → copy `DATABASE_URL`
4. Vercel: new project → import GitHub repo → add `DATABASE_URL` and `AUTH_SECRET` env vars
5. After first deploy: connect to Vercel Postgres or Neon, run `npx prisma migrate deploy && npx prisma db seed`
6. Get a live URL like `https://horecom-platform.vercel.app` — share with co-founder

### 2. Submit WhatsApp templates to Meta (2–7 days approval — DO IT TODAY)
Templates are in `prisma/seed.ts` as `WA_TEMPLATES` array. Six templates currently:
`order_confirmed`, `order_delivered`, `subscription_reminder`, `substitution_review`, `group_threshold_reached`, `group_failed`.
Submit via 360dialog dashboard. They block Sprint 4.

### 3. Tilda data migration (3 days total work)
The user's question was "do we need to save the database from Tilda?" Answer: **Tilda only has the catalog**. Real orders + customers are in **AmoCRM**.
- **Day 1:** Tilda Store → CSV export of full catalog → write `scripts/import-tilda-csv.ts` to map to `Product` schema and replace current seed
- **Day 2:** AmoCRM API pull `/api/v4/companies` + `/api/v4/contacts` + `/api/v4/leads` → write `scripts/import-amocrm.ts` to seed companies + users + order history
- **Day 3:** Manual interview with co-founder → seed the 10+ existing subscription plans (probably they only live in her head + WhatsApp)

### 4. Sprint 1 work: auth + onboarding (2 weeks)
- NextAuth.js v5 setup
- OTP verify endpoint using 360dialog send_template
- `/auth/login` page with phone input + OTP verify
- `/onboarding/segment` page where user picks `ENTERPRISE | SMB_REPLENISHMENT | MICRO_GROUPBUY`
- `/onboarding/company` page with company name + BIN/IIN + first address
- Middleware: redirect unauth from `/cart` and `/profile` to `/auth/login`

### 5. Sprint 2: cart + checkout (2 weeks)
- Zustand store at `lib/cart-store.ts`
- "Add to cart" button on PDP wired up
- `/cart` page with line items + MOQ validation + warnings
- 3-step checkout: cart → delivery slot → payment method
- Kaspi Pay handoff (or invoice for legal entities)
- Order creation with `WAITING_PAYMENT` initial state

## Coding conventions

- **TypeScript strict mode.** No `any`. Use `unknown` + type narrowing.
- **Server Components by default.** Only use `"use client"` when needed (forms, state, browser APIs).
- **Prisma queries in server components.** Don't proxy through API routes unless needed.
- **Path alias `@/`** for imports from project root.
- **No dynamic Tailwind classes** like `bg-${color}` — won't be tree-shaken correctly. Use full strings.
- **ISR + dynamic flag** on DB-querying routes. Currently using `export const dynamic = "force-dynamic"` because Next.js was crashing at build time without a DB. When deployed with real DB, revert to ISR with `revalidate`.
- **Validation with Zod** for all server actions and API routes.
- **Components named with `PascalCase`, files `kebab-case.tsx`**.
- **No state in shared components** — pass via props or context.

## Common commands

```bash
# Dev
npm install --legacy-peer-deps
npm run dev                          # http://localhost:3000

# Database
npx prisma migrate dev               # create migration + apply
npx prisma migrate deploy            # apply existing migrations (CI)
npx prisma db seed                   # seed data
npx prisma studio                    # GUI for DB at :5555
npx prisma generate                  # regenerate client after schema change
npx prisma migrate reset             # nuke + reseed (dev only!)

# Build
npm run build                        # production build
npm run start                        # serve production build
npm run lint                         # check code quality

# Deploy
vercel                               # deploy to Vercel preview
vercel --prod                        # deploy to production
```

## Where to find things

| Need | Where |
|---|---|
| Why we chose Company-centric model | `docs/10-synthesis-master.md` §"Verdict #2" |
| Substitution flow detail | `docs/13-substitution-ux-spec.md` |
| WhatsApp template texts | `prisma/seed.ts` → `WA_TEMPLATES` |
| Color tokens | `app/globals.css` CSS variables |
| Sprint plan | `docs/22-product-vision.md` §2.3 + `docs/32-ev-tech-exhibit.md` |
| EV grant proposal | `docs/31-ev-application-proposal.md` |
| Real customer metrics | `docs/23-traction-metrics.md` |
| Founder bios | `docs/24-founders-story.md` |
| Reference contacts | `docs/26-references.md` |
| External URLs (IG, LinkedIn) | `docs/25-links-index.md` |

## Working principles

- **Read `docs/10-synthesis-master.md` before making large architectural changes.** Many decisions already have explicit verdicts with reasoning.
- **When in doubt about a feature, default to the simpler version that ships.** This codebase is being built by ~1.5 people, not a team of 10. Avoid over-engineering.
- **The grant proposal `docs/31-ev-application-proposal.md` is the public commitment.** What we ship has to match what we promised reviewers. Predictive subscription with WhatsApp confirmations is in scope. Native mobile app is not in V1 — that's V2.
- **Never break the (redacted) lesson.** Operational fundamentals (substitution UX, real returns flow, inventory truth) ship before adding new surface area. This is non-negotiable per `docs/24-founders-story.md` §4.3.
- **Be honest about what's not built yet.** The home page currently shows "Group Buying — coming soon" because it is V1.5. Don't pretend Group Buy is live by removing the badge.
- **Every B2B-facing surface needs:** loading state, empty state, error state, mobile + desktop layout.

## Contact

- co-founder — Telegram/WhatsApp for product questions
- co-founder — for operations / customers / suppliers questions
- Дияр — Telegram for active work coordination

---

*Last updated: May 19, 2026 — initial V1 skeleton committed and verified building.*
