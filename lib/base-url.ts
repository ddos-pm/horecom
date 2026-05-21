/**
 * Canonical public-facing base URL for the V1 platform.
 *
 * Until the custom domain is wired (horecom.kz currently points at the
 * old Tilda site), public links in sitemap, llms.txt, metadata, and
 * Schema.org JSON-LD all need to resolve to the Vercel alias so AI
 * crawlers, Google, and grant reviewers actually land on V1 — not
 * Tilda.
 *
 * Override by setting NEXT_PUBLIC_SITE_URL in Vercel env. When the team
 * cuts horecom.kz over to V1, flip the env to "https://horecom.kz" and
 * every public surface picks it up without a code change.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://horecom-platform-eosin.vercel.app";
