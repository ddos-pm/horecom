import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user || !data.user.email) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabaseId = data.user.id;
  const email = data.user.email;

  let dbUser = await prisma.user.findUnique({ where: { supabaseId } });

  if (!dbUser) {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      dbUser = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { supabaseId, lastLoginAt: new Date() },
      });
    } else {
      dbUser = await prisma.user.create({
        data: { supabaseId, email, lastLoginAt: new Date() },
      });
    }
  } else {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { lastLoginAt: new Date() },
    });
  }

  const target = dbUser.companyId ? next : "/onboarding";
  return NextResponse.redirect(`${origin}${target}`);
}
