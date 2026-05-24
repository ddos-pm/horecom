/**
 * scripts/seed-test-user.ts
 *
 * Creates a fully-wired test account so Дияр / a reviewer can play with the
 * platform without going through the onboarding flow:
 *
 *   1. Creates / upserts a Supabase Auth user (email confirmed, no password).
 *   2. Creates / upserts a Company row ("Кафе Демо · тест-аккаунт") with a
 *      realistic IIN + segment + default address.
 *   3. Links the User to the Company.
 *   4. Generates a one-time magic-link via Supabase admin API and prints it.
 *
 * Re-run any time — idempotent. The printed link is valid for 1 hour.
 *
 * Usage:
 *   npx tsx scripts/seed-test-user.ts                   # default email
 *   TEST_EMAIL=diyar@horecom.kz npx tsx scripts/seed-test-user.ts
 *
 * Required env (already in .env.local on the platform laptop):
 *   - SUPABASE_SERVICE_ROLE_KEY (admin operations)
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - DATABASE_URL / DIRECT_URL (Prisma)
 *   - NEXT_PUBLIC_BASE_URL (used in the magic-link redirect target)
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const EMAIL = process.env.TEST_EMAIL ?? "test@horecom.kz";
const PASSWORD = process.env.TEST_PASSWORD ?? "horecom-demo-2026";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://horecom-platform-eosin.vercel.app";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("✗ SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL required");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding test account for ${EMAIL}…`);

  // 1. Ensure Supabase Auth user exists (email confirmed)
  let supabaseUserId: string;
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users.find((u) => u.email === EMAIL);

  if (existing) {
    supabaseUserId = existing.id;
    // Ensure password is current — useful if seed re-runs with new TEST_PASSWORD.
    await admin.auth.admin.updateUserById(existing.id, { password: PASSWORD });
    console.log(`  ✓ Supabase Auth user already exists (id=${supabaseUserId.slice(0, 8)}…), password reset`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { source: "seed-test-user", note: "тест-аккаунт для демо" },
    });
    if (error || !data.user) {
      throw new Error(`createUser failed: ${error?.message ?? "no user returned"}`);
    }
    supabaseUserId = data.user.id;
    console.log(`  ✓ Supabase Auth user created (id=${supabaseUserId.slice(0, 8)}…)`);
  }

  // 2. Find-or-create Company. There's no natural unique key on Company —
  // match by name to keep the seed idempotent across re-runs.
  let company = await prisma.company.findFirst({
    where: { name: "Кафе Демо · тест-аккаунт" },
    include: { addresses: true },
  });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Кафе Демо · тест-аккаунт",
        binOrIin: "123456789012",
        segment: "SMB_REPLENISHMENT",
        substitutionPreference: "ASK",
        city: "Astana",
        addresses: {
          create: [
            {
              label: "Основной адрес доставки",
              street: "ул. Кенесары",
              house: "12А",
              details: "офис 5, 2 этаж",
              city: "Astana",
              isDefault: true,
            },
          ],
        },
      },
      include: { addresses: true },
    });
  }
  console.log(`  ✓ Company ready: ${company.name} (id=${company.id.slice(0, 8)}…)`);

  // 3. Upsert User row linked to the company. isAdmin=true so the test
  // account can also browse /admin/* — that gate checks dbUser.isAdmin.
  const user = await prisma.user.upsert({
    where: { supabaseId: supabaseUserId },
    update: { companyId: company.id, email: EMAIL, isAdmin: true },
    create: {
      supabaseId: supabaseUserId,
      email: EMAIL,
      companyId: company.id,
      name: "Тестовый пользователь",
      role: "OWNER",
      isAdmin: true,
    },
  });
  console.log(`  ✓ User row linked to Company (role=${user.role}, isAdmin=${user.isAdmin})`);

  // 4. Generate one-time magic-link.
  // Supabase enforces its own allowlist for redirect URLs (configured in
  // Authentication → URL Configuration on the dashboard). If our redirectTo
  // isn't in the list, Supabase silently swaps it for the project's Site
  // URL — which here is a stale branch URL. We rewrite the redirect_to
  // query param in the returned link so it points at the prod alias and
  // hits /auth/callback regardless of dashboard config.
  const wantRedirect = `${BASE_URL}/auth/callback?next=%2Fdashboard`;
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: EMAIL,
    options: { redirectTo: wantRedirect },
  });
  if (linkErr || !link?.properties?.action_link) {
    throw new Error(`generateLink failed: ${linkErr?.message ?? "no link returned"}`);
  }

  // Force-rewrite the redirect_to so we land on /auth/callback on prod
  // even if Supabase substituted a stale Site URL.
  const url = new URL(link.properties.action_link);
  url.searchParams.set("redirect_to", wantRedirect);
  const fixedLink = url.toString();

  console.log();
  console.log("=".repeat(80));
  console.log("ГОТОВО — тестовый аккаунт готов:");
  console.log();
  console.log(`  Email   : ${EMAIL}`);
  console.log(`  Пароль  : ${PASSWORD}`);
  console.log(`  Company : ${company.name}`);
  console.log(`  Адрес   : ${company.addresses[0].street}, ${company.addresses[0].house}`);
  console.log(`  Сегмент : ${company.segment}`);
  console.log();
  console.log("ЗАЙТИ ЧЕРЕЗ ПАРОЛЬ (быстро, многоразово):");
  console.log(`  1. Открой ${BASE_URL}/login`);
  console.log("  2. Введи email");
  console.log('  3. Жми "У меня есть пароль →"');
  console.log("  4. Введи пароль выше → Войти");
  console.log();
  console.log("ИЛИ одноразовый magic-link (валидный 1 час):");
  console.log();
  console.log(fixedLink);
  console.log();
  console.log("=".repeat(80));
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
