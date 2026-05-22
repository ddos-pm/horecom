/**
 * scripts/generate-icons.ts
 *
 * Source: public/logos/logo-mark.png — orange bird on a solid black square.
 * Дияр's complaint: the black square reads as ugly on iOS home screen and
 * dark-mode browser tabs.
 *
 * Pipeline:
 *   1. Color-key the near-black pixels to transparent so we have an
 *      orange-bird-on-alpha source.
 *   2. Add a small padding box so the bird isn't edge-to-edge (iOS round-rect
 *      mask + visual breathing room).
 *   3. Composite over a target background (transparent or white) at each
 *      output size.
 *
 * Outputs:
 *   - app/icon.png             32x32 transparent  (browser favicon, Next auto-link)
 *   - app/apple-icon.png      180x180 WHITE       (iOS strips alpha → white BG)
 *   - public/icon-192.png     192x192 transparent (Android PWA, manifest ref)
 *   - public/icon-512.png     512x512 transparent (PWA splash, manifest ref)
 *   - public/favicon.ico       32x32 transparent  (legacy fallback, kept as PNG-in-ICO)
 */

import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const SOURCE = "public/logos/logo-mark.png";

// Pixels with all RGB channels at or below this value are considered the
// black background and get keyed to transparent. 30 catches anti-alias edges
// without nibbling the orange (orange R ≈ 248, far above 30).
const BLACK_THRESHOLD = 30;

async function loadBirdOnTransparent(): Promise<sharp.Sharp> {
  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a === 0 || (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD)) {
      // background → fully transparent
      out[i] = 0; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 0;
    } else {
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a;
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } });
}

async function makeSquareIcon(
  size: number,
  background: "transparent" | "white",
  outPath: string,
  paddingRatio = 0.1,
) {
  const bird = await loadBirdOnTransparent();
  const inner = Math.round(size * (1 - paddingRatio * 2));
  const resizedBird = await bird
    .resize({ width: inner, height: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const bg =
    background === "white"
      ? { r: 255, g: 255, b: 255, alpha: 1 }
      : { r: 0, g: 0, b: 0, alpha: 0 };

  const canvas = sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  });

  await canvas.composite([{ input: resizedBird, gravity: "center" }]).png().toFile(outPath);
  console.log(`  ✓ ${outPath} (${size}x${size}, ${background})`);
}

async function main() {
  console.log("Generating Horecom icon set (uniform WHITE background)…");
  // White on every size: a transparent favicon reads as black on
  // dark-mode browser tabs and on iOS home screen. Дияр's call: orange
  // mark on a clean white square everywhere — consistent across surfaces.
  // 15% inner padding so the iOS round-rect mask doesn't clip the mark.
  await makeSquareIcon(32, "white", "app/icon.png", 0.15);
  await makeSquareIcon(180, "white", "app/apple-icon.png", 0.15);
  await makeSquareIcon(192, "white", "public/icon-192.png", 0.15);
  await makeSquareIcon(512, "white", "public/icon-512.png", 0.15);

  // favicon.ico — sharp can't emit multi-resolution .ico, but every
  // browser also accepts a single PNG renamed to .ico. Use the keyed
  // bird composited on white at 32x32 so the legacy /favicon.ico URL
  // matches the rest of the set.
  const bird32 = await makeSquareIconBuffer(32, "white", 0.15);
  await writeFile("public/favicon.ico", bird32);
  console.log("  ✓ public/favicon.ico (32x32 PNG-in-ICO, white BG)");

  // Legacy direct-probe fallbacks under public/ for browsers/feed
  // readers that hit the bare URL instead of following the <link> tag.
  await writeFile("public/favicon.png", await makeSquareIconBuffer(32, "white", 0.15));
  await writeFile("public/apple-touch-icon.png", await makeSquareIconBuffer(180, "white", 0.15));
  console.log("  ✓ public/favicon.png + public/apple-touch-icon.png");
}

async function makeSquareIconBuffer(
  size: number,
  background: "transparent" | "white",
  paddingRatio: number,
): Promise<Buffer> {
  const bird = await loadBirdOnTransparent();
  const inner = Math.round(size * (1 - paddingRatio * 2));
  const resizedBird = await bird
    .resize({ width: inner, height: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const bg =
    background === "white"
      ? { r: 255, g: 255, b: 255, alpha: 1 }
      : { r: 0, g: 0, b: 0, alpha: 0 };
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: resizedBird, gravity: "center" }])
    .png()
    .toBuffer();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
