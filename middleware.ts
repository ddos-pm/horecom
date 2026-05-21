import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Future: app.horecom.kz subdomain routing.
  // Next.js route groups already resolve /cart → (app)/cart and /catalog → (marketing)/catalog,
  // so the middleware is a placeholder for subdomain split and (Этап 2+) auth gates.
  if (host.startsWith("app.")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logos|.*\\.png).*)"],
};
