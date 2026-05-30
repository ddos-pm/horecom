/**
 * Flat ESLint config for Next.js 15.
 *
 * Replaces the deprecated `next lint` command. Layered shape:
 *
 *   1. Ignored paths — generated/output dirs and one-off scripts that
 *      don't get reviewed against the same rules as app code.
 *   2. next/core-web-vitals + next/typescript via FlatCompat — pulls in
 *      the official Next.js plugin rules under the new flat-config shape.
 *   3. Project rule tweaks — relax patterns that produce a lot of noise
 *      without catching real bugs in this codebase.
 *   4. Per-file overrides — routes that live OUTSIDE the [locale]
 *      segment legitimately use plain <a> tags (the next-intl <Link>
 *      would 404 them through locale routing); we silence the
 *      no-html-link-for-pages rule there with a comment-style override
 *      in eslint config rather than scattering disable comments.
 *
 * Run with `npm run lint` (now points at `eslint .`) or `eslint <path>`.
 */

import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      "scripts/**",
      "prisma/seed.ts",
      "tests/**",
      ".claude/**",
      "design-final-clean/**",
      "postcss.config.mjs",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-floating-promises": "off",
      // Apostrophes and quotes inside JSX text content are readable as-is —
      // forcing every "Cake Studio LLP" or "We deliver before you're out"
      // into &apos; / &quot; entities makes the source much harder to scan.
      // The actual HTML output is correct either way.
      "react/no-unescaped-entities": "off",
      // Logo <img> tags are intentional in a handful of places (no remote
      // optimization needed; preserves CSS sizing). Keep as warning.
      "@next/next/no-img-element": "warn",
    },
  },
  {
    // /cart, /login, /onboarding, /checkout, /dashboard, /profile, /orders,
    // /admin, /subscription/manage live OUTSIDE the [locale] segment in
    // middleware.ts (APP_PREFIXES). A next-intl <Link> here would prefix
    // /ru/ and 404; a next/link <Link> would still work but the rule sees
    // these as page-routes and warns. The plain <a> is correct.
    files: [
      "components/cart/cart-icon-badge.tsx",
      "components/marketing/header.tsx",
      "components/marketing/mobile-drawer.tsx",
      "app/global-error.tsx",
    ],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default config;
