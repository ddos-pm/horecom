export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://horecom.kz/#organization",
  name: "Horecom",
  alternateName: "Хореком",
  url: "https://horecom.kz",
  logo: "https://horecom.kz/logo.png",
  description:
    "B2B procurement platform for HoReCa businesses in Central Asia. Wholesale food ingredients and confectionery raw materials.",
  foundingDate: "2016",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Шамши Калдаякова, 1",
    addressLocality: "Астана",
    addressCountry: "KZ",
  },
  sameAs: [
    "https://www.instagram.com/horecom.kz",
    "https://www.threads.com/@horecom.kz",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Russian", "Kazakh"],
    telephone: "+7-707-860-77-79",
  },
};

export const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://horecom.kz/#website",
  url: "https://horecom.kz",
  name: "Horecom",
  publisher: { "@id": "https://horecom.kz/#organization" },
  inLanguage: "ru-KZ",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://horecom.kz/catalog?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};
