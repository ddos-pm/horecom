# Tyler-readiness checkpoint — May 31, 2026

> Snapshot of platform state right before Tyler Cowen / Mercatus EV
> reviewer testing window. All 5 pre-review steps shipped.

## State at handoff

| Surface | Status | Prod TTFB warm |
|---|---|---:|
| `/ru`, `/en` home | ✓ | 0.5–1.9 s |
| `/en/catalog` | ✓ | 0.5 s |
| `/en/about`, `/faq`, `/privacy`, `/offer`, `/delivery-and-payment`, `/how-ordering-works` | ✓ | 0.4–0.5 s |
| `/en/subscription`, `/en/group-buying` | ✓ | 1.9–2.2 s |
| `/en/product/<slug>` | ✓ | 2.5–5 s (cache instance-bound, fluctuates) |
| `/llms.txt` (AI agents) | ✓ | 0.4–0.7 s |
| `/api/mcp/{manifest,tools,call}` | ✓ | 0.7–5 s |
| `/api/healthz` | ✓ | 1.5 s |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | ✓ | <1 s |

All 30 public routes return 200. No 4xx/5xx surfaced in smoke pass.

## 5 pre-review steps completed

### 1. Prod health + smoke pass ✓
Curl across 30 public routes including `/ru`, `/en`, `/kz`, all
landings, MCP endpoints, sitemap, robots, manifest. Every endpoint
returned 2xx. No fixes needed.

### 2. Fix anything broken ✓
Nothing broken to fix — closed as no-op.

### 3. MCP demo verification ✓
- `/api/mcp/manifest.json` returns valid plugin spec
- `/api/mcp/tools` lists 6 tools (search, get, check_inventory,
  volume_pricing, find_similar, create_draft_order)
- `/api/mcp/call` with `search_products` returns real catalog data
- One polish ship: product_url and confirmation_url default to `/en/*`
  (AI agents are English-speaking) — commit `f61ad09`

### 4. Hero-perf polish ✓
StatusStrip on home page was issuing a duplicate `prisma.product.count`
that the cached home loader already paid for. Refactored to accept
skuCount as a prop. One fewer Tokyo round-trip per home render. Commit
`720430d`.

### 5. E2E walkthrough confirmation ✓
Simulated Tyler's journey:
  1. `/` → 307 redirect to `/ru`
  2. Switches to `/en` via globe-icon — 0.5–1.9 s
  3. Clicks Catalog — 0.5 s
  4. Opens a PDP — 2.5–5 s (see "known limits" below)
  5. Reads `/en/subscription` for the differentiator — 2 s
  6. Reads `/llms.txt` (AI grant angle) — 0.4–0.7 s after warmup
  7. Probes `/api/mcp/*` — manifest 1.5 s, search 4–5 s

Final perf pass shipped two cross-request caches:
  - PDP loader: unstable_cache per slug + React.cache wrapper
  - llms.txt: 1-hour categories cache
Commit `3a9656c`.

## What Tyler will see

### First impression (`/en`)
English hero "Wholesale supply for bakeries, cafes, and pastry chefs
in Astana", segment cards (3-mode workflow), ops band ("How an order
flows" + "What we get right"), proof block ("$0.6M turnover · 50+
recurring customers"), final CTA.

### Switcher
Globe-icon dropdown in header (and mobile drawer). RU / EN / KZ active.
Persists via NEXT_LOCALE cookie across navigation including app pages.

### AI/MCP angle (per grant proposal)
- `/llms.txt` advertises the MCP endpoints + describes the platform
  in 80 lines of structured English. Categories list is up-to-date
  via cached read.
- `/api/mcp/manifest.json` returns a 2025-06 schema-compliant plugin
  manifest with all 6 tool endpoints.
- `/api/mcp/tools` lists the tool surface with JSON schemas.
- `/api/mcp/call` executes any tool with real catalog data.

A Tyler-quality test prompt for an AI agent: "What chocolate brands
does Horecom carry, and what's the cheapest option in stock right
now?" — the agent should be able to call `search_products` →
`check_inventory` and return a real answer.

### Catalog (`/en/catalog`)
24 products per page, sidebar facets (categories + brands + mode),
fast cookie-aware language switching, all UI in English, product
names still Russian (catalog data; merch team task per
docs/41-performance-audit.md).

### PDP (`/en/product/<slug>`)
Gallery, 3-tier pricing (one-off / subscription / group), MOQ +
inventory in real time, breadcrumbs, "Frequently bought together"
related-products grid, English policy block, WhatsApp deep-link with
English message template.

## Known limits Tyler may encounter

1. **PDP TTFB fluctuates 2.5–5 s.** Vercel's `unstable_cache` is
   per-edge-instance, so different requests routed to different workers
   may see cold cache. Mitigation in flight but not solvable without
   PPR (Next 15 canary-only) or build-time prerendering (currently
   blocked by an unrelated next-intl SSG issue documented in
   `docs/41-performance-audit.md` Tier 3).

2. **MCP `search_products` 4–5 s cold.** Full-text search + 3 product
   joins against the Tokyo Supabase pooler. Acceptable for agentic
   use; not a user-facing latency.

3. **Some product names still in Russian on /en.** Catalog data
   (product/category names, brand strings) lives in `name` /
   `nameKz` columns; `nameEn` infra is in place
   (`lib/i18n-field.ts pickLocalized`) but merch team owns content
   backfill. Pack-label unit suffixes (кг → kg, etc.) are
   transliterated at render time via `lib/format-pack.ts`.

4. **KZ locale is draft.** Switcher shows it, layout works, but
   content is still mostly Russian (banner explains). Native
   Kazakh-speaker pass pending.

5. **/admin needs admin user.** Tyler can't see it without seeding
   his account `isAdmin=true`. Scripted via `scripts/seed-test-user.ts`
   (already configured to seed Дияр's account as admin per recent
   commit; add Tyler's email manually if/when he requests admin).

## Commits in this Tyler-ready session

```
3a9656c  perf: cross-request cache for PDP loader + llms.txt categories
720430d  perf(home): pass skuCount as prop to StatusStrip
f61ad09  fix(mcp): default product + confirmation URLs to English locale
```

Plus the full perf-audit fixes that preceded:
```
415255e  perf(home): unstable_cache home-page DB reads behind 10-min revalidate
de4ee1d  perf(ssg): setRequestLocale on every marketing page
49b34af  perf(middleware): bypass Supabase on 9 stateless endpoints
150f483  perf(login): code-split Supabase auth SDK
4ea0da0  perf(catalog): collapse 7 sequential DB hits to 4 parallel via FILTER
78b7672  perf(pdp): React cache() loader dedupes generateMetadata + page queries
3a18eb7  perf(ssg): revert dynamic <html lang> read to restore marketing SSG
```

## If something breaks during Tyler's testing

- Vercel deployments: https://vercel.com/ddos-pms-projects/horecom-platform
- Healthz: https://horecom-platform-eosin.vercel.app/api/healthz
- Rollback to known-good: `git revert HEAD; git push` (last 10 commits all green)
- Logs: Vercel dashboard → Functions tab → relevant route
