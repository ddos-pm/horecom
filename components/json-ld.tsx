import { COMPANY } from "@/lib/company";
import { SITE_URL } from "@/lib/base-url";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Locale-aware Organization JSON-LD.
 *
 * Address fields are translated (street + locality) so /en pages emit
 * "1 Shamshi Kaldayakov St." / "Astana" instead of the Russian original.
 * Description stays English on every locale (matches schema.org convention
 * for `description` to be most-understandable), but `inLanguage` and
 * `availableLanguage` reflect the page locale.
 */
export function buildOrgJsonLd(locale: string): Record<string, unknown> {
  const isEn = locale === "en";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://horecom.kz/#organization",
    name: "Horecom",
    alternateName: isEn ? "Horecom" : "Хореком",
    url: "https://horecom.kz",
    logo: "https://horecom.kz/logo.png",
    description:
      "B2B procurement platform for HoReCa businesses in Central Asia. Wholesale food ingredients and confectionery raw materials.",
    foundingDate: "2016",
    address: {
      "@type": "PostalAddress",
      streetAddress: isEn ? COMPANY.streetAddressEn : COMPANY.streetAddressRu,
      addressLocality: isEn ? COMPANY.addressLocalityEn : COMPANY.addressLocalityRu,
      addressCountry: "KZ",
    },
    sameAs: [
      "https://www.instagram.com/horecom.kz",
      "https://www.threads.com/@horecom.kz",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: isEn ? ["English", "Russian", "Kazakh"] : ["Russian", "Kazakh"],
      telephone: "+7-707-860-77-79",
    },
  };
}

/**
 * Locale-aware WebSite JSON-LD.
 *
 * `inLanguage` reports the active locale, and the SearchAction URL pattern
 * reflects the locale prefix so search engines treat /en/catalog?q= as the
 * English search surface.
 */
export function buildWebsiteJsonLd(locale: string): Record<string, unknown> {
  const isEn = locale === "en";
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://horecom.kz/#website",
    url: "https://horecom.kz",
    name: "Horecom",
    publisher: { "@id": "https://horecom.kz/#organization" },
    inLanguage: isEn ? "en" : locale === "kz" ? "kk" : "ru-KZ",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${locale}/catalog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Back-compat exports — keep the static RU shape so callers that haven't
// migrated to the factory still build. New code should call
// buildOrgJsonLd(locale) / buildWebsiteJsonLd(locale) instead.
export const ORG_JSON_LD = buildOrgJsonLd("ru");
export const WEBSITE_JSON_LD = buildWebsiteJsonLd("ru");
