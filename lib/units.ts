/**
 * Translate internal unitType ("piece", "kg", "l", "g", "ml") to a user-facing
 * abbreviation in the active locale.
 *
 * Falls back to the raw value if unmapped. Default locale is Russian; pass
 * "kz" for Kazakh display where it makes a visible difference.
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

export function formatUnit(unitType: string | null | undefined, locale: "ru" | "kz" = "ru"): string {
  if (!unitType) return "";
  const dict = locale === "kz" ? KZ : RU;
  return dict[unitType.toLowerCase()] ?? unitType;
}
