# Performance Audit — May 30, 2026

> Snapshot after the i18n + post-i18n audit (commits 62e5f59 …
> 395e799). Surfaces the biggest perf regressions introduced during
> that work + a prioritized fix list ordered by ROI (impact ÷ effort).

## Headline finding

**Every marketing page is now dynamically rendered per request even
though they're marked SSG.** The root cause is one line: `app/layout.tsx`
calls `getLocaleFromCookie()` to set `<html lang>`. Next.js sees any
`cookies()` read in any server component and de-opts the entire route
tree from static. Production TTFB jumped from ≤50 ms (edge cache) to
**4–8 s cold / 4 s warm** on `/ru` and `/en` home.

Fixing that one regression is the single highest-ROI move in this audit.

## Measurements (prod, May 30 14:35 UTC)

| URL | TTFB (warm) | Total | HTML size | Notes |
|---|---:|---:|---:|---|
| `/ru` | 4.34 s | 4.74 s | 198 KB | Should be SSG (●) — currently dynamic |
| `/en` | 4.28 s | 4.65 s | 190 KB | Same |
| `/ru/catalog` | 0.52 s | 4.75 s | 330 KB | Force-dynamic by design (filters) |
| `/en/catalog` | 0.43 s | 4.48 s | 327 KB | Same |
| `/ru/subscription` | 1.87 s | 1.99 s | 125 KB | ISR `revalidate:300` (already optimized) |
| `/ru/group-buying` | 1.77 s | 2.16 s | 185 KB | Same ISR |
| First Load JS (shared) | — | — | 224 KB | Acceptable; Next 15 baseline |
| Middleware | — | — | 215 KB | Runs on every non-static path |

## Bundle decomposition

| Chunk | Raw size |
|---|---:|
| 5431-…js  (Supabase auth client + cart store) | 423 KB |
| main-…js  (Next runtime) | 401 KB |
| 4591-…js  (Supabase ssr) | 194 KB |
| framework-…js (React) | 190 KB |
| polyfills-…js | 113 KB |

Heaviest pages by page-specific JS (excluding shared 224 KB):

| Route | Page chunk | First Load JS |
|---|---:|---:|
| `/login` | 3.9 KB | **322 KB** ← Supabase auth client makes this the largest single bundle |
| `/profile` | 7.8 KB | 262 KB |
| `/onboarding` | 7.2 KB | 252 KB |
| `/checkout` | 7.0 KB | 264 KB |
| `/[locale]/product/[slug]` | 4.6 KB | 267 KB |
| `/[locale]/catalog` | 4.6 KB | 267 KB |

## DB query patterns

`/[locale]/product/[slug]`:
- `generateMetadata`: `prisma.product.findUnique({where:{slug}, ...})`
- `ProductPage` render: same `prisma.product.findUnique({where:{slug}, ...})` again

→ **Two round-trips to the Tokyo Supabase pooler** per PDP request.
Same product fetched twice; React's `cache()` would dedupe inside the
same request automatically. Easy ~250 ms win.

`/[locale]/catalog`:
- `Promise.all([categories, products, count, brandAgg])` — 4 parallel
- Then `Promise.all([subscriptionCount, groupCount, inStockCount])` — 3 more

The second group runs *sequentially after* the first because of `await`
on the first. Six round-trips total. The three `_count`s could be
folded into a single raw-SQL `SELECT COUNT(*) FILTER (WHERE …)` query
(saves 2 round-trips, ~500 ms).

## Other observations

- **Middleware matcher** correctly excludes `_next/static`, `*.png`,
  `*.svg`, `llms.txt`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`.
  Could add `/api/healthz` + `/api/mcp/manifest.json` (both stateless,
  don't need Supabase session refresh).
- **Inter font** loaded with subsets `["latin", "cyrillic"]` and 4
  weights. Cyrillic subset alone is ~30 KB woff2; total ~120 KB of
  fonts. Display: swap so it's not render-blocking. Fine for now.
- **globals.css** 26 KB — sizable but tree-shaken Tailwind utility
  classes plus all the custom `.hc-*` / `.cat-*` blocks. Acceptable.
- **3 `<img>` warnings** (header / drawer / one in group-buying) — all
  intentional (logo + Tilda CDN image inside an iframe-style mock).
  Could swap to `<Image unoptimized priority>` for marginal SEO/LCP win.
- **No CSP / no-cache headers** on API routes — minor security tightening
  worth doing separately.
- **`<html lang>` dynamic** — the line that triggered the catastrophic
  TTFB regression. See the prioritized fix list below.

## Prioritized fix list (impact ÷ effort)

### Tier 1 — Ship today

**1.1  Drop `<html lang>` dynamic read in root layout** *(15 min effort,
saves 4 sec TTFB on every home/landing visit)*

```diff
- export default async function RootLayout({...}) {
-   const locale = await getLocaleFromCookie();
-   const htmlLang = locale === "kz" ? "kk" : locale;
-   return <html lang={htmlLang}>...
+ export default function RootLayout({...}) {
+   return <html lang="ru">...
```

Per-locale `<html lang>` survives elsewhere — add a `lang` attribute on
the `<body>` element inside the marketing `[locale]/layout.tsx` (which
is already async + locale-aware). Screen readers honor the nearest
ancestor with a lang attribute; CSS that branches on `:lang()` works on
the body too. Server SEO crawlers prefer the `<html>` tag but the
`<title>`, JSON-LD `inLanguage`, and `hreflang` alternates we already
emit cover them — the Lighthouse "lang attribute" audit reads the
nearest enclosing one and will still pass.

**1.2  React `cache()` on product loader** *(20 min, saves ~250 ms per
PDP)*

```ts
// lib/product-loader.ts
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getProductBySlug = cache((slug: string) =>
  prisma.product.findUnique({ where: { slug }, include: {...} })
);
```

Both `generateMetadata` and the page body call `getProductBySlug(slug)`;
React dedupes within the same request automatically.

### Tier 2 — This sprint

**2.1  Collapse catalog page's 7 DB queries to 4** *(45 min, saves ~500
ms warm + 2 connection slots on the Tokyo pooler)*

Replace the second `Promise.all` (3 `prisma.product.count` calls) with
one raw query:

```ts
const counts = await prisma.$queryRaw<[{ sub: bigint; grp: bigint; stock: bigint }]>`
  SELECT
    COUNT(*) FILTER (WHERE "isSubscriptionEligible") AS sub,
    COUNT(*) FILTER (WHERE "isGroupEligible")        AS grp,
    COUNT(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM "InventorySnapshot" i
      WHERE i."productId" = "Product"."id" AND i."availableQty" > 0
    )) AS stock
  FROM "Product"
  WHERE "isActive" = true
`;
```

Also run *both* Promise.all groups in parallel instead of sequential.

**2.2  Lazy-load Supabase auth client on `/login`** *(60 min, saves
~80 KB on First Load JS for the login page)*

Split the email/password form into its own client component dynamically
imported only when the user actually hits Submit. OTP form can stay as
is (no Supabase client dep).

**2.3  Exclude `/api/healthz` + `/api/mcp/manifest.json` + `/llms.txt`
from middleware** *(10 min, saves Supabase session-refresh overhead on
every health check)*

Already excluded `_next/*`, `*.png`, etc. Add these three to the
negative-lookahead matcher.

### Tier 3 — Backlog

**3.1  PPR (Partial Prerendering)** — Next 15 canary feature. Would
unlock the "cached static shell + Suspense-streamed dynamic islands"
combo that the subscription/group-buying pages already lay out the
groundwork for. Per CLAUDE.md the version is pinned and PPR is canary-
only. Revisit when Next 15 stable adds PPR.

**3.2  Pre-render top-N product PDPs** at build time. Currently
`generateStaticParams` ships top-30 by `minOrderQty`. Could bump to
top-100 by 90-day order frequency once order data accumulates.

**3.3  Edge runtime for marketing pages.** Currently nodejs. Edge would
halve cold-start latency but the Prisma client is not edge-compatible
without the Data Proxy. Stay on nodejs for now.

**3.4  Image format**: Supabase Storage serves WebP/AVIF on demand via
the Next/image transform. No action needed.

**3.5  CSP + cache headers** on API routes (separate security pass).

## Action plan

If we ship Tier 1 today (~35 min total work), home TTFB drops from 4 s
to <100 ms and PDP saves ~250 ms. That's the entire user-perceived
regression introduced by the i18n migration paid back in one commit.

Tier 2 is a half-day sprint that ships incremental DB and bundle wins.

Tier 3 is "when there's slack" — none is regressive against current
behaviour.
