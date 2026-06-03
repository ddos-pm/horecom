import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Content-Security-Policy. Defense-in-depth on top of React's output
// escaping. unsafe-inline + unsafe-eval are required for Next.js script
// hydration + Tailwind injected styles; tightening to a nonce-based
// policy would require app-router middleware rewrites and isn't worth
// the friction yet.
//
// img-src includes the two CDNs we actually serve from (Tilda historic,
// Supabase post-migration) + data:/blob: for base64 blur placeholders.
// connect-src whitelists Supabase + AmoCRM so server actions and the
// Amo lead-push fetch don't get blocked.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://static.tildacdn.com https://static.tildacdn.pro https://thb.tildacdn.com https://thb.tildacdn.pro https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.amocrm.ru",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  // Block clickjacking (legacy X-Frame-Options retained alongside the
  // newer frame-ancestors in CSP — older browsers honour only this one)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Block MIME-sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send referrer cross-origin only as origin (no path/query leaks)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny powerful browser APIs we don't use
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Speed up cross-origin link clicks
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Cross-origin isolation — prevents window opener attacks
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Supabase Storage (primary host post-migration from Tilda).
      // Hostname pattern <project-ref>.supabase.co — wildcard covers
      // any project ref we end up on, no env coupling.
      { protocol: "https", hostname: "*.supabase.co" },
      // Tilda CDN (origin of seed images — kept until migrate-images
      // script flips every product.imageUrl off this host).
      { protocol: "https", hostname: "static.tildacdn.pro" },
      { protocol: "https", hostname: "static.tildacdn.com" },
      { protocol: "https", hostname: "thb.tildacdn.pro" },
      { protocol: "https", hostname: "thb.tildacdn.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.horecom.kz" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Force the Next.js client router cache to drop DYNAMIC segments
    // immediately. Without this, clicking a catalog sidebar Link to
    // /ru/catalog?category=X from /ru/catalog (same pathname, different
    // query) reuses the cached unfiltered RSC payload and the filter
    // doesn't apply on soft-nav. Direct URL loads worked because they
    // bypass the cache; only the click was broken. Playwright caught it
    // in tests/e2e/site-walkthrough.spec.ts §3.
    //
    // STATIC pages keep the default 5-min client cache (was set to 0
    // earlier alongside dynamic but that was a leak: every nav between
    // landings — about → faq → privacy etc. — refetched the same RSC
    // payload that the edge had already cached. Static:300 saves the
    // round-trip and the catalog-filter bug is unaffected because that
    // route is force-dynamic, not static).
    staleTimes: { dynamic: 0, static: 300 },
    // Partial Prerendering would let the auth-dependent Suspense island
    // coexist with a cached static shell, BUT it requires Next canary —
    // stable 15.x rejects `experimental.ppr` at build time. Sticking with
    // standard SSR for /subscription + /group-buying; FCP still benefits
    // from the Suspense skeleton even though TTFB stays dynamic.
  },
};

// Sentry wraps everything; uploads source maps in CI only when
// SENTRY_AUTH_TOKEN is present. Without it the build still succeeds
// (Sentry skips source-map upload silently). DSN is read at runtime from
// process.env, so Sentry is no-op when DSN isn't configured.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  sourcemaps: { disable: true },
  webpack: {
    treeshake: { removeDebugLogging: true },
    reactComponentAnnotation: { enabled: false },
    automaticVercelMonitors: false,
  },
});
