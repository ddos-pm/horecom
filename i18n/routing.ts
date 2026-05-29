import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // ru — primary, source of truth for all marketing copy.
  // kz — draft, content still rendered in Russian; native-speaker pass pending.
  // en — for grant reviewers / international press; full UI translation pending,
  //      but /en routes resolve and show an English hero block on the home page
  //      so a non-Russian reader gets the pitch in their language.
  locales: ["ru", "kz", "en"] as const,
  defaultLocale: "ru" as const,
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
