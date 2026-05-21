import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
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

function isAppPath(pathname: string) {
  return APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAppPath(pathname)) {
    return await updateSession(request);
  }

  // Marketing path → next-intl handles locale prefix
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Exclude static assets, _next, sitemap, llms.txt, robots
    "/((?!_next/static|_next/image|favicon.ico|logos|sitemap|sitemap.xml|llms.txt|robots.txt|.*\\.png).*)",
  ],
};
