/**
 * Translate internal unitType ("piece", "kg", "l", "g", "ml") to a user-facing
 * abbreviation in the active locale.
 *
 * Falls back to the raw value if unmapped. Default locale is Russian; pass
 * "en" or "kz" for the corresponding display.
 */

const RU: Record<string, string> = {
  piece: "шт",
  pcs: "шт",
  unit: "шт",
  pack: "уп",
  kg: "кг",
  g: "г",
  l: "л",
  ml: "мл",
};

const KZ: Record<string, string> = {
  piece: "дана",
  pcs: "дана",
  unit: "дана",
  pack: "уп",
  kg: "кг",
  g: "г",
  l: "л",
  ml: "мл",
};

const EN: Record<string, string> = {
  piece: "pc",
  pcs: "pcs",
  unit: "pc",
  pack: "pack",
  kg: "kg",
  g: "g",
  l: "L",
  ml: "mL",
};

export function formatUnit(
  unitType: string | null | undefined,
  locale: "ru" | "en" | "kz" = "ru",
): string {
  if (!unitType) return "";
  const dict = locale === "en" ? EN : locale === "kz" ? KZ : RU;
  return dict[unitType.toLowerCase()] ?? unitType;
}
