/**
 * Horecom — public contact & operational details.
 *
 * Legal-entity fields (legal name, ИИН, IBAN, bank, BIK, registered address)
 * are intentionally NOT stored in code. They are supplied to legal-entity
 * customers via the invoice/contract issued after registration, never
 * exposed on the public site.
 */

export const COMPANY = {
  // Brand
  shortName: "Horecom",

  currency: "KZT" as const,

  // Operational address (warehouse + pickup point — public).
  physicalAddress: "г. Астана, ул. Шамши Калдаякова, 1",
  physicalAddressEn: "Astana, 1 Shamshi Kaldayakov St.",
  // Address parts kept separate for JSON-LD PostalAddress (where street and
  // locality are addressed in different fields).
  streetAddressRu: "ул. Шамши Калдаякова, 1",
  streetAddressEn: "1 Shamshi Kaldayakov St.",
  addressLocalityRu: "Астана",
  addressLocalityEn: "Astana",
  city: "Astana",
  country: "KZ",

  // Contacts
  phoneWhatsApp: "+77078607779",
  phoneCallback: "+77077119952",
  phoneWhatsAppDisplay: "+7 707 860 77 79",
  phoneCallbackDisplay: "+7 707 711 9952",
  email: "Horecomkz@gmail.com",
  emailPrivacy: "Horecomkz@gmail.com",

  // Social
  instagram: "https://www.instagram.com/horecom.kz/",
  instagramHandle: "@horecom.kz",
  threads: "https://www.threads.com/@horecom.kz",
  whatsappLink: "https://api.whatsapp.com/send/?phone=77078607779",

  // Business
  yearFounded: 2016,

  // Operational thresholds
  minOrderKzt: 5000,
  freeDeliveryThresholdKzt: 20000,
  freeDeliveryThresholdSubscriptionKzt: 7000,
  paidDeliveryFeeKzt: 1000,
} as const;
