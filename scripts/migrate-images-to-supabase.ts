/**
 * scripts/migrate-images-to-supabase.ts
 *
 * One-shot migration: download every Tilda-hosted product image,
 * upload it to a public Supabase Storage bucket, then update
 * Product.imageUrl (and Product.imageUrls) in the DB to the new URL.
 *
 * Why: Tilda CDN is the LCP bottleneck on /ru/catalog (~4.5s on
 * image fetch). Supabase Storage is colocated with the rest of the
 * stack (same project) and serves from a CDN with much better
 * latency from EU/CA Vercel regions.
 *
 * Idempotent — products whose imageUrl is already on Supabase
 * Storage are skipped. Safe to re-run after a partial run.
 *
 * Usage:
 *   npx tsx scripts/migrate-images-to-supabase.ts --dry-run   # no writes
 *   npx tsx scripts/migrate-images-to-supabase.ts             # for real
 *
 * Required env (already in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL / DIRECT_URL (Prisma)
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const BUCKET = "product-images";
const SUBDIRS_TO_MIGRATE = ["tildacdn.com", "tildacdn.pro"];
const CONCURRENCY = 4; // be polite to Tilda; 4 parallel fetches

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const prisma = new PrismaClient();

function needsMigration(url: string | null): boolean {
  if (!url) return false;
  return SUBDIRS_TO_MIGRATE.some((host) => url.includes(host));
}

function extForUrl(url: string): string {
  const m = url.match(/\.(jpe?g|png|webp|gif|avif)(\?|$)/i);
  return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".webp";
}

async function ensureBucket() {
  const { data: buckets } = await admin.storage.listBuckets();
  if (buckets?.find((b) => b.name === BUCKET)) return;
  if (dryRun) {
    console.log(`  [dry-run] would create public bucket "${BUCKET}"`);
    return;
  }
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB cap per image
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`createBucket failed: ${error.message}`);
  }
  console.log(`  ✓ created public bucket "${BUCKET}"`);
}

async function migrateOne(sku: string, sourceUrl: string): Promise<string | null> {
  const path = `${sku}${extForUrl(sourceUrl)}`;
  const { data: existing } = admin.storage.from(BUCKET).getPublicUrl(path);

  if (dryRun) {
    console.log(`  [dry-run] ${sku}: ${sourceUrl.slice(0, 60)}... → ${path}`);
    return existing.publicUrl;
  }

  try {
    const r = await fetch(sourceUrl);
    if (!r.ok) {
      console.warn(`  ✗ ${sku}: fetch ${r.status} ${sourceUrl.slice(0, 60)}...`);
      return null;
    }
    const ct = r.headers.get("content-type") ?? "image/webp";
    const buf = Buffer.from(await r.arrayBuffer());
    const { error } = await admin.storage.from(BUCKET).upload(path, buf, {
      contentType: ct,
      upsert: true,
      cacheControl: "31536000", // 1 year — content-addressed by sku
    });
    if (error) {
      console.warn(`  ✗ ${sku}: upload ${error.message}`);
      return null;
    }
    return existing.publicUrl;
  } catch (e) {
    console.warn(`  ✗ ${sku}: ${e instanceof Error ? e.message : "unknown"}`);
    return null;
  }
}

async function pool<T, R>(items: T[], n: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  const workers = Array.from({ length: n }, async () => {
    while (idx < items.length) {
      const myIdx = idx++;
      results[myIdx] = await fn(items[myIdx], myIdx);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log(`Migrating product images${dryRun ? " (DRY RUN)" : ""}…`);
  await ensureBucket();

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, sku: true, imageUrl: true, imageUrls: true },
  });
  const todo = products.filter(
    (p) => needsMigration(p.imageUrl) || p.imageUrls.some((u) => needsMigration(u)),
  );
  console.log(`  scanning ${products.length} products — ${todo.length} need migration`);

  if (todo.length === 0) {
    console.log("  ✓ nothing to do");
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  await pool(todo, CONCURRENCY, async (p) => {
    // Primary imageUrl
    let newPrimary = p.imageUrl;
    if (needsMigration(p.imageUrl)) {
      const fresh = await migrateOne(p.sku, p.imageUrl!);
      if (fresh) newPrimary = fresh;
      else failed++;
    }

    // imageUrls array
    const newUrls: string[] = [];
    for (let i = 0; i < p.imageUrls.length; i++) {
      const u = p.imageUrls[i];
      if (needsMigration(u)) {
        const fresh = await migrateOne(`${p.sku}-${i + 1}`, u);
        newUrls.push(fresh ?? u);
        if (!fresh) failed++;
      } else {
        newUrls.push(u);
      }
    }

    if (dryRun) {
      console.log(`  [dry-run] would update ${p.sku}`);
      skipped++;
      return;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: { imageUrl: newPrimary, imageUrls: newUrls },
    });
    migrated++;
    if (migrated % 10 === 0) {
      console.log(`  … ${migrated}/${todo.length}`);
    }
  });

  console.log();
  console.log(`Done. migrated=${migrated} skipped=${skipped} failed=${failed}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
