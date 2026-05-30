/**
 * Translate unit suffixes inside a free-text pack label like "10 кг" → "10 kg",
 * "1 л" → "1 L". DB stores Russian labels; on /en we transliterate the unit
 * substrings without round-tripping through the schema.
 *
 * Only swaps a known set of unit abbreviations and only when the active
 * locale is English. Other locales pass through unchanged.
 *
 * Important: JavaScript's `\b` word boundary is ASCII-only and doesn't
 * recognize Cyrillic letters as word characters — `/\bкг\b/` matches the
 * substring "кг" anywhere. We use explicit Cyrillic-letter lookarounds to
 * ensure "кг" inside a longer Cyrillic word (e.g., the brand "Любимо" or
 * "кгроссво") is not mistaken for the unit suffix.
 *
 * Brand and product NAMES in the label (e.g., "Шокодель 10 кг") are
 * intentionally NOT translated — those are catalog content owned by the
 * merch team. This helper only handles the trailing unit suffix.
 */

// A Cyrillic letter (any case + ё/Ё) — used as the lookaround character class
// to mimic a word boundary that works for Cyrillic input.
const C = "[А-Яа-яЁё]";

function unitBoundary(unit: string): RegExp {
  // Negative lookbehind + lookahead: the substring is not preceded or
  // followed by a Cyrillic letter. Catches "кг" in "10 кг" and "10кг" while
  // skipping "кг" embedded inside a longer Cyrillic word.
  return new RegExp(`(?<!${C})${unit}(?!${C})`, "gi");
}

// Order matters: multi-letter suffixes that overlap a shorter one MUST come
// first (e.g., "кг" before bare "г", "гр" before bare "г", "мл" before "л",
// "упак" before "уп"). Otherwise "кг" gets eaten by the bare-"г" rule first.
const RULES: Array<[RegExp, string]> = [
  [unitBoundary("кг"), "kg"],
  [unitBoundary("гр"), "g"],
  [unitBoundary("мл"), "mL"],
  [unitBoundary("упак\\.?"), "pack"],
  [unitBoundary("уп\\.?"), "pack"],
  [unitBoundary("шт"), "pcs"],
  [unitBoundary("л"), "L"],
  [unitBoundary("г"), "g"],
];

export function localizePackLabel(label: string | null | undefined, locale: string): string {
  if (!label) return "";
  if (locale !== "en") return label;
  let out = label;
  for (const [re, repl] of RULES) out = out.replace(re, repl);
  return out;
}
