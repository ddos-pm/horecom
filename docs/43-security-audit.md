# Security audit — June 3, 2026

> Snapshot after the SEC-1 → SEC-4 fixes shipped in commits fa3df84
> + e4e0e0b. Catalogs current state, applied fixes, and remaining items
> in the backlog with severity tags.

## Current security posture

### Headers (next.config.ts → SECURITY_HEADERS, all routes)

| Header | Value | Status |
|---|---|---|
| Content-Security-Policy | restrictive default-src 'self' + specific allowlists per directive | ✓ active |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | ✓ preloaded |
| X-Frame-Options | `SAMEORIGIN` | ✓ + redundant via CSP frame-ancestors |
| X-Content-Type-Options | `nosniff` | ✓ |
| Referrer-Policy | `strict-origin-when-cross-origin` | ✓ |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | ✓ |
| Cross-Origin-Opener-Policy | `same-origin` | ✓ |

Verified live on prod (`curl -I https://horecom-platform-eosin.vercel.app/ru`).

### CSP detail

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src  'self' 'unsafe-inline';
img-src    'self' blob: data: https://static.tildacdn.com https://static.tildacdn.pro
                   https://thb.tildacdn.com https://thb.tildacdn.pro
                   https://*.supabase.co;
font-src   'self' data:;
connect-src 'self' https://*.supabase.co https://*.amocrm.ru;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests
```

**Accepted compromises (documented in next.config.ts):**

1. `script-src 'unsafe-inline'` — Next 15's hydration emits inline
   `<script>` blocks for the React serialization payload. Eliminating
   needs nonces propagated via middleware + a custom Next runtime
   patch (open issue upstream as of 2026-05). Tradeoff: XSS payloads
   that bypass React's escaping can execute. Mitigated by React's
   default escaping + the absence of `dangerouslySetInnerHTML` outside
   the locale-controlled JSON-LD block.
2. `script-src 'unsafe-eval'` — required by Next runtime + some
   dev-time tooling. Same nonce path applies.
3. `style-src 'unsafe-inline'` — Tailwind's CSS-in-JS approach injects
   `<style>` blocks for arbitrary utility combinations. No clean path
   to strict CSP for styles short of CSS modules everywhere.

**Path to strict CSP (Tier 3 backlog):**
Wait for Next 15 stable to ship the nonce middleware pattern. Track
https://github.com/vercel/next.js/discussions/54907 for status. Once
in place:
  - Middleware generates a per-request nonce.
  - CSP becomes `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`.
  - All `<script>` / `<style>` blocks emit `nonce={nonce}` attribute.
This drops the XSS surface meaningfully.

## Fixes shipped in this audit

| ID | Severity | Description | Commit |
|---|---|---|---|
| SEC-1 | **CRITICAL** | Open redirect on /login?redirectTo= | `fa3df84` |
| SEC-2 | **HIGH** | /api/orders + /api/payments/kaspi/invoice had no rate limit | `fa3df84` |
| SEC-3 | MEDIUM | .env.example drifted 8 vars from runtime config | `e4e0e0b` |
| SEC-4 | LOW | CSP audit doc (this file) | this commit |
| BUG-1 | (audit) | Probed 11 edge-case URLs that could 500 — all return 4xx | `e4e0e0b` |

### SEC-1: open redirect (fixed)

`/login?redirectTo=https://evil.com/phish` would have redirected the
user after a successful sign-in. New `safeRedirectTo()` helper in
`app/(auth)/login/page.tsx` allows same-origin paths only. Rejects:
- protocol-relative `//evil.com`
- absolute `https://...`
- `javascript:` pseudo
- backslash tricks
- `@`/`:` injection in the first path segment

Tests: `tests/unit/safe-redirect.test.ts` (9 cases). The helper is
duplicated in the test file because the login page is "use client" and
vitest's node env can't load `next/navigation` hooks; both copies
must stay in sync.

### SEC-2: rate-limit gap (fixed)

`/api/orders` and `/api/payments/kaspi/invoice` were authenticated
but unbounded. A logged-in attacker could:
  - flood the ops team via order-created emails + AmoCRM push
  - burn Kaspi API quota via invoice retries (idempotent at handler
    level but still wasteful)

Added two new buckets in `lib/ratelimit.ts`:
  - `orders`:  10 per 5 min per user (well above legit 1-2/hr)
  - `invoice`: 20 per 5 min per user

Both use per-user keys (`user:${supabaseId}`) not per-IP so co-located
legit users don't get punished for one attacker. Locale-aware 429
messages.

### SEC-3: env.example drift (fixed)

Code referenced 8 vars not in `.env.example`. Examples:
- `D360_API_KEY` (code) vs `WHATSAPP_API_KEY` (template — wrong name)
- `KASPI_WEBHOOK_SECRET` — required for webhook signature verify
- `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_MANAGER` — for customer email
- `CRON_SECRET` — Bearer auth on cron route

Refresh adds all 8 + drops 4 stale entries (`WHATSAPP_API_KEY`,
`CLOUDINARY_*` — migrated off both). Header note "Last sync with code:
2026-06-03" marks the freshness so the next audit can spot drift fast.

### BUG-1: prod runtime error scan (no findings)

Probed 11 edge-case URLs that could 500:
- POST /api/orders without body (401 ✓)
- POST /api/orders without auth (401 ✓)
- POST /api/payments/kaspi/invoice without auth (401 ✓)
- POST /api/payments/kaspi/webhook without signature (401 ✓)
- POST /api/auth/otp/request with empty phone (400 ✓)
- POST /api/auth/otp/verify with non-numeric code (400 ✓)
- POST /api/mcp/call with invalid tool_name (400 ✓)
- GET /en/product/non-existent-slug (404 ✓)
- GET /en/group/invalid-token (404 ✓)
- GET /api/healthz (200 ✓)

All return correct 4xx — no 5xx surfaced.

## Authn / authz coverage

| Endpoint | Authn | Authz | Rate-limit |
|---|---|---|---|
| GET /api/healthz | none (public) | n/a | none (lightweight) |
| GET /api/mcp/{manifest,tools} | none (public) | n/a | mcp bucket via lib/mcp/rate-limit.ts |
| POST /api/mcp/call | none (public) | n/a | mcp bucket via lib/mcp/rate-limit.ts |
| POST /api/auth/otp/request | none (pre-login) | n/a | webhook bucket per IP |
| POST /api/auth/otp/verify | none (pre-login) | n/a | webhook bucket per IP |
| POST /api/orders | Supabase session | own company | **orders bucket per user** ✓ new |
| POST /api/payments/kaspi/invoice | Supabase session | own order OR isAdmin | **invoice bucket per user** ✓ new |
| POST /api/payments/kaspi/webhook | HMAC-SHA256 sig | n/a | none (sig is the gate) |
| POST /api/amocrm/webhook | Shared secret in header/query | n/a | webhook bucket per IP |
| POST /api/cron/subscription-reminders | Bearer CRON_SECRET | Vercel cron | none (auth is the gate) |

## Remaining items (backlog)

| ID | Severity | Description |
|---|---|---|
| SEC-5 | LOW | CSP nonces once Next 15 stable supports the pattern |
| SEC-6 | LOW | Add HMAC verification to /api/amocrm/webhook (currently shared secret only; defense in depth) |
| SEC-7 | INFO | DB latency 1.1 s — Tokyo Supabase region. Move would require migration; out of scope here |
| SEC-8 | LOW | Add per-IP + per-user combo to /api/auth/otp/* (currently IP only — single attacker can rotate IPs) |
| SEC-9 | INFO | Audit Sentry events for accidental PII (emails, phone in stack traces) once Sentry quota fills |

## How to verify after deploy

```
# 1. Headers still applied
curl -I https://horecom-platform-eosin.vercel.app/ru | grep -iE \
  "content-security|strict-transport|x-frame|x-content-type|referrer|permissions|cross-origin"

# 2. Open-redirect rejected
curl -L "https://horecom-platform-eosin.vercel.app/login?redirectTo=//evil.com"
# Should redirect to /login then to /dashboard after login (not //evil.com)

# 3. Rate limit triggered (need Upstash configured)
for i in {1..15}; do curl -X POST -H "content-type: application/json" \
  -H "Authorization: Bearer <valid-supabase-session>" \
  -d '{"items":[...], "addressId":"..."}' \
  https://horecom-platform-eosin.vercel.app/api/orders; done
# After ~10 should see 429
```

## How to roll back if a fix breaks something

```bash
git revert fa3df84    # SEC-1 + SEC-2
git revert e4e0e0b    # SEC-3 + BUG-1 closure (.env.example)
git push origin main
```

Each commit is independent — partial revert is safe.
