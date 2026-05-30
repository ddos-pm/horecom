import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format KZT price with locale-appropriate digit grouping.
 *   ru: thin no-break space   → "1 234 567 ₸"
 *   en: comma                 → "1,234,567 ₸"
 *   kz: thin no-break space   → "1 234 567 ₸"  (Kazakhstan formal style)
 *
 * The currency symbol stays ₸ across all locales — that's the actual mark
 * Kazakhstan uses, not a localizable string.
 */
export function formatPrice(
  value: number | string,
  currency = "₸",
  locale: "ru" | "en" | "kz" = "ru",
): string {
  const n = typeof value === "string" ? Number(value) : value;
  const intl = locale === "en" ? "en-US" : locale === "kz" ? "ru-RU" : "ru-RU";
  const formatted = n.toLocaleString(intl, { maximumFractionDigits: 0 });
  return `${formatted} ${currency}`;
}

/** Stock status badge text + color, locale-aware. */
export function stockStatusInfo(
  status: string,
  locale: "ru" | "en" | "kz" = "ru",
): { label: string; tone: "success" | "warning" | "danger" } {
  const isEn = locale === "en";
  switch (status) {
    case "IN_STOCK":
      return { label: isEn ? "In stock" : "В наличии", tone: "success" };
    case "LOW_STOCK":
      return { label: isEn ? "Low stock" : "Мало", tone: "warning" };
    case "OUT_OF_STOCK":
      return { label: isEn ? "Out of stock" : "Нет в наличии", tone: "danger" };
    default:
      return { label: status, tone: "warning" };
  }
}

export function segmentLabel(
  segment: string,
  locale: "ru" | "en" | "kz" = "ru",
): string {
  const isEn = locale === "en";
  switch (segment) {
    case "ENTERPRISE":
      return isEn ? "HoReCa / restaurant" : "HoReCa / ресторан";
    case "SMB_REPLENISHMENT":
      return isEn ? "Bakery" : "Кондитерская";
    case "MICRO_GROUPBUY":
      return isEn ? "Independent pastry maker" : "Самозанятый кондитер";
    default:
      return segment;
  }
}
