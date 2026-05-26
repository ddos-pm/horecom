import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Paths that live OUTSIDE the locale segment (no /ru, /kz prefix).
// They run through Supabase session refresh / auth gate instead of intl routing.
const APP_PREFIXES = [
  "/cart",
  "/checkout",
  "/orders",
  "/profile",
  "/dashboard",
  "/subscription/manage",
  "/admin",
  "/onboarding",
  "/login",
  "/auth",
  "/api",
];

const LOCALE_PREFIXES = routing.locales.map((l) => `/${l}`);

function isAppPath(pathname: string) {
  return APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Strip a /ru or /kz prefix if the rest of the path is an app route. Returns
// the canonical path or null when no rewrite applies. Prevents 404s like
// /ru/cart when a stale link or i18n <Link> prefixes an app path.
function stripLocaleFromAppPath(pathname: string): string | null {
  for (const lp of LOCALE_PREFIXES) {
    if (pathname === lp || pathname.startsWith(`${lp}/`)) {
      const rest = pathname.slice(lp.length) || "/";
      if (isAppPath(rest)) return rest;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /.well-known is a public discovery namespace (ai-plugin.json, etc.) —
  // don't run it through Supabase session refresh or next-intl locale
  // routing. Pass through to the route handler directly.
  if (pathname.startsWith("/.well-known/")) {
    return;
  }

  // /ru/cart, /kz/checkout, … → 308 to the canonical app path. App routes
  // live outside the [locale] segment; a leftover locale prefix would 404.
  const canonical = stripLocaleFromAppPath(pathname);
  if (canonical) {
    const url = request.nextUrl.clone();
    url.pathname = canonical;
    return NextResponse.redirect(url, 308);
  }

  if (isAppPath(pathname)) {
    return await updateSession(request);
  }

  // Marketing path → next-intl handles locale prefix
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Exclude static assets, _next, sitemap, llms.txt, robots, .well-known,
    // and Next.js metadata routes (icon/apple-icon/manifest auto-generated
    // by app/icon.png + app/apple-icon.png + app/manifest.ts). Without
    // these exclusions next-intl wraps them in locale routing and they
    // 500/307 in production.
    "/((?!_next/static|_next/image|favicon\\.ico|logos|sitemap|sitemap\\.xml|llms\\.txt|robots\\.txt|\\.well-known|manifest\\.webmanifest|icon|apple-icon|.*\\.png|.*\\.svg|.*\\.ico).*)",
  ],
};
