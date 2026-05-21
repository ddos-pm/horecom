import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const SECURITY_HEADERS = [
  // Block clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Block MIME-sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send referrer cross-origin only as origin (no path/query leaks)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny powerful browser APIs we don't use
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Speed up cross-origin link clicks
  { key: "X-DNS-Prefetch-Control", value: "on" },
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
  reactComponentAnnotation: { enabled: false },
  tunnelRoute: "/monitoring",
  sourcemaps: { disable: true },
  disableLogger: true,
  automaticVercelMonitors: false,
});
