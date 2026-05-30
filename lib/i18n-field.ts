/**
 * Pick the right localized DB field with graceful fallback.
 *
 *   pickLocalized({ name: "Сгущёнка", nameEn: "Condensed milk" }, "en", "name")
 *     → "Condensed milk"
 *   pickLocalized({ name: "Сгущёнка" }, "en", "name")
 *     → "Сгущёнка"   (fallback — nameEn not filled in yet)
 *   pickLocalized({ name: "Сгущёнка", nameKz: "Шартықсыз сүт" }, "kz", "name")
 *     → "Шартықсыз сүт"
 *
 * The base field (e.g., name) is treated as the source of truth and the
 * locale variants (nameEn / nameKz) as optional overrides. This matches
 * how the schema is shaped today — base is non-null, variants are
 * nullable so the merch team can fill them incrementally.
 */

type WithVariants<F extends string> = {
  [K in F]?: string | null;
} & {
  [K in `${F}En`]?: string | null;
} & {
  [K in `${F}Kz`]?: string | null;
};

export function pickLocalized<F extends string>(
  row: WithVariants<F>,
  locale: string,
  baseField: F,
): string {
  const enField = `${baseField}En` as `${F}En`;
  const kzField = `${baseField}Kz` as `${F}Kz`;
  const base = (row[baseField] as string | null | undefined) ?? "";
  if (locale === "en") {
    const en = row[enField] as string | null | undefined;
    return en && en.trim() ? en : base;
  }
  if (locale === "kz") {
    const kz = row[kzField] as string | null | undefined;
    return kz && kz.trim() ? kz : base;
  }
  return base;
}
