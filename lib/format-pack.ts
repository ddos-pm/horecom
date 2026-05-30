/**
 * Translate unit suffixes inside a free-text pack label like "10 кг" → "10 kg",
 * "1 л" → "1 L". DB stores Russian labels; on /en we transliterate the unit
 * substrings without round-tripping through the schema.
 *
 * Only swaps a known set of unit abbreviations and only when the active
 * locale is English. Other locales pass through unchanged.
 *
 * NOTE: brand and product NAMES in the label (e.g., "Шокодель 10 кг") are
 * intentionally NOT translated — those are catalog content owned by the
 * merch team. This helper only handles the trailing unit suffix.
 */

const UNIT_SUFFIX_MAP: Array<[RegExp, string]> = [
  [/\bкг\b/gi, "kg"],
  [/\bгр\b/gi, "g"],
  [/\bмл\b/gi, "mL"],
  [/\bл\b/gi, "L"],
  [/\bшт\b/gi, "pcs"],
  [/\bупак\.?/gi, "pack"],
  [/\bуп\.?/gi, "pack"],
  [/\bг\b/gi, "g"], // bare "г" (gram) — must come AFTER "гр" / "кг" / "мг" / "мл" matches
];

export function localizePackLabel(label: string | null | undefined, locale: string): string {
  if (!label) return "";
  if (locale !== "en") return label;
  let out = label;
  for (const [re, repl] of UNIT_SUFFIX_MAP) out = out.replace(re, repl);
  return out;
}
