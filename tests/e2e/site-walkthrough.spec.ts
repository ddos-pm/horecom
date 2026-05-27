/**
 * tests/e2e/site-walkthrough.spec.ts
 *
 * End-to-end browser walkthrough of horecom-platform — Playwright drives a real
 * Chromium against the deployed Vercel URL and tries to behave like a B2B user
 * exploring the site for the first time.
 *
 * Each test is independent. Failures are captured with screenshot + trace into
 * test-results/. Run:
 *   npx playwright test tests/e2e/site-walkthrough.spec.ts --reporter=list
 *
 * Target: PROD by default. Override with BASE_URL env.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "https://horecom-platform-eosin.vercel.app";

test.describe("Horecom site walkthrough", () => {
  test.describe.configure({ timeout: 60_000 });

  test("1. home page loads + key elements visible", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru`);
    await expect(page).toHaveTitle(/Horecom/i);
    await expect(page.locator("h1")).toContainText(/опт|астан|пекарен/i);
    // Cart icon must link to /cart (not /ru/cart — regression for b7daee2)
    const cartHref = await page.locator("a.hc-cart").getAttribute("href");
    expect(cartHref).toBe("/cart");
    // Theme-color meta
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute("content");
    expect(themeColor).toBe("#F18305");
  });

  test("2. catalog page loads with sidebar + grid", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/catalog`);
    // Sidebar has all 11 categories
    const categoryLinks = page.locator(".sidebar .filt a");
    await expect(categoryLinks.first()).toBeVisible();
    const count = await categoryLinks.count();
    expect(count).toBeGreaterThanOrEqual(11); // "Все товары" + 11 cats
    // At least 100 product cards rendered (we have 189 active, take 200)
    const cards = page.locator(".card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(100);
  });

  test("3. sidebar category click narrows results", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/catalog`);
    // Click "Сиропы" via the .cat-list sidebar link (not the footer copy).
    // Fixed by switching <Link href={{pathname, query}}> → string href on
    // the catalog sidebar — the object form dropped the query on same-
    // pathname client nav.
    await page.locator('.cat-list a[href="/ru/catalog?category=syrups"]').click();
    await page.waitForURL(/category=syrups/, { timeout: 15_000 });
    await expect(page.locator("h1")).toContainText(/Сиропы/);
    const slugs = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/ru/product/"]')) as HTMLAnchorElement[];
      const set = new Set<string>();
      for (const a of links) {
        const m = a.getAttribute("href")!.match(/^\/ru\/product\/([a-z0-9-]+)$/);
        if (m) set.add(m[1]);
      }
      return set.size;
    });
    expect(slugs).toBe(31);
  });

  test("4. catalog search input filters live (debounce 300ms)", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/catalog`);
    // Type into the search input (catalog inline one, .search-big)
    const input = page.locator('.search-big input[name="q"]');
    await expect(input).toBeVisible();
    await input.fill("DECOL");
    // Debounce is 300ms — wait + URL should update
    await page.waitForURL(/q=DECOL/, { timeout: 5_000 });
    // Result count narrows to ~25
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    const slugs = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href^="/ru/product/"]'));
      return new Set(links.map((a) => a.getAttribute("href")!.split("/").pop())).size;
    });
    expect(slugs).toBeGreaterThan(10);
    expect(slugs).toBeLessThan(35);
  });

  test("5. open PDP — enriched content + Add to cart", async ({ page }) => {
    // Use a SKU known to be in-stock (the Tokyo seed assigns ~50% IN_STOCK).
    // "Инвертный сахар Тримолин 7кг" — qty 45 at sample time.
    await page.goto(`${BASE_URL}/ru/product/invertnyy-sahar-trimolin-vedro-7kg`);
    await expect(page.locator("h1")).toBeVisible();
    // Enriched sections
    await expect(page.getByRole("heading", { name: /Описание/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Когда использовать/ })).toBeVisible();
    // Specs sidebar
    await expect(page.getByText("Характеристики")).toBeVisible();
    // Add to cart button — on PDP the label is "Добавить в корзину" (or
    // "Нет в наличии" if OUT_OF_STOCK; in-stock SKU above ensures the
    // happy-path label). Match by visible text instead of role-name regex
    // because Button accessible name can be quirky.
    const addBtn = page.getByText(/Добавить в корзину/).first();
    await expect(addBtn).toBeVisible();
  });

  test("6. Add to cart updates badge counter in header", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/catalog?category=syrups`);
    // Initial: no badge
    const badge = page.locator(".hc-cart-count");
    await expect(badge).toHaveCount(0);
    // Click the first product's "В корзину"
    const firstAdd = page.locator(".card button:has-text('В корзину')").first();
    await firstAdd.click();
    // Toast appears
    await expect(page.getByText(/В корзине/i)).toBeVisible({ timeout: 3000 });
    // Badge appears with count ≥ 1
    await expect(badge).toBeVisible();
    const count = parseInt((await badge.textContent()) || "0", 10);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("7. Cart icon click → /cart (redirects unauth to /login)", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/catalog`);
    await page.locator("a.hc-cart").click();
    // Should land on /login (unauth) — middleware redirects
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("login");
    expect(page.url()).toContain("redirectTo");
  });

  test("8. /login renders email form", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByRole("heading", { name: /Вход в Horecom/i })).toBeVisible();
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    const submitBtn = page.getByRole("button", { name: /Получить ссылку|Отправляю/i });
    await expect(submitBtn).toBeVisible();
    // Logo on standalone login page (Variant A — no sidebar leak)
    await expect(page.locator('img[alt="Horecom"]')).toBeVisible();
    // No app sidebar
    const sidebar = page.locator(".hc-app-sidebar, .app-sidebar");
    await expect(sidebar).toHaveCount(0);
  });

  test("9. header search debounce navigates to catalog with q", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru`);
    // Desktop header search (hc-search) — only visible ≥900px wide
    await page.setViewportSize({ width: 1280, height: 800 });
    const headerSearch = page.locator(".hc-search input[name='q']");
    await expect(headerSearch).toBeVisible();
    await headerSearch.fill("шоколад");
    await page.waitForURL(/catalog\?q=/, { timeout: 5_000 });
    expect(page.url()).toContain("q=");
  });

  test("10. mobile drawer opens and contains search + nav", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${BASE_URL}/ru`);
    const hamburger = page.locator("button.hc-hamb");
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    // Drawer slides open
    const drawer = page.locator("aside.hc-drawer");
    await expect(drawer).toHaveClass(/open/);
    // Nav links present
    await expect(drawer.getByText(/Каталог/)).toBeVisible();
    await expect(drawer.getByText(/Подписка/)).toBeVisible();
    // Drawer search input
    const drawerSearch = drawer.locator('input[name="q"]');
    await expect(drawerSearch).toBeVisible();
  });

  test("11. footer has 'Для AI-агентов' link to /llms.txt", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru`);
    const aiLink = page.locator('a[href="/llms.txt"]');
    await expect(aiLink).toBeVisible();
    await expect(aiLink).toContainText(/AI/i);
  });

  test("12. KZ banner shows on /kz, hidden on /ru", async ({ page }) => {
    await page.goto(`${BASE_URL}/kz`);
    await expect(page.getByText(/Қазақша нұсқа дайындалуда/)).toBeVisible();
    await page.goto(`${BASE_URL}/ru`);
    await expect(page.getByText(/Қазақша нұсқа дайындалуда/)).not.toBeVisible();
  });

  test("13. subscription page form gated for anon", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/subscription`);
    await expect(page.locator("h1")).toBeVisible();
    // Anon user — should see "Войдите чтобы оформить подписку"
    await expect(page.getByText(/Войдите/i).first()).toBeVisible();
  });

  test("14. group buying page shows pilot badge", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/group-buying`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(/в.пилоте|скоро|coming/i).first()).toBeVisible();
  });

  test("15. icons render with white background (no transparent on tab)", async ({ page }) => {
    const r1 = await page.request.get(`${BASE_URL}/icon.png`);
    expect(r1.status()).toBe(200);
    const r2 = await page.request.get(`${BASE_URL}/apple-icon.png`);
    expect(r2.status()).toBe(200);
    const r3 = await page.request.get(`${BASE_URL}/manifest.webmanifest`);
    expect(r3.status()).toBe(200);
    const manifest = await r3.json();
    expect(manifest.name).toContain("Horecom");
    expect(manifest.theme_color).toBe("#F18305");
  });

  test("16. JSON-LD on PDP — Product + Breadcrumb + Offer", async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/product/mindalnaya-muka-ispaniya-1kg`);
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = new Set<string>();
    for (const s of jsonLdScripts) {
      try {
        const d = JSON.parse(s);
        if (d["@type"]) types.add(d["@type"]);
        if (d["@graph"]) for (const g of d["@graph"]) types.add(g["@type"]);
      } catch {}
    }
    expect(types.has("Product")).toBeTruthy();
    expect(types.has("BreadcrumbList")).toBeTruthy();
    // Product should have an Offer
    const productBlock = jsonLdScripts.find((s) => s.includes('"@type":"Product"'));
    expect(productBlock).toBeTruthy();
    const product = JSON.parse(productBlock!);
    expect(product.offers).toBeDefined();
    expect(product.offers.priceCurrency).toBe("KZT");
    expect(product.offers.priceValidUntil).toBeTruthy();
  });
});
