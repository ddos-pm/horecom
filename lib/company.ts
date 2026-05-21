/**
 * Horecom — legal entity & contact details
 * Single source of truth for company info used across the site.
 * Source: confirmed by co-founder, May 20, 2026
 */

export const COMPANY = {
  // Legal entity
  legalName: "ИП co-founder",
  legalNameShort: "individual entrepreneur (details on request)",
  legalNameKz: "individual entrepreneur менеджер (redacted)",
  legalNameEn: "Individual Entrepreneur Ospanova co-founder",
  
  // Brand
  shortName: "Horecom",
  
  // Tax & banking (Kazakhstan)
  iin: "***REMOVED***",
  iban: "***REMOVED***",
  bank: 'АО "***REMOVED***"',
  bik: "***REMOVED***",
  kbe: "19",
  currency: "KZT" as const,
  vat: false, // ИП on simplified taxation — no VAT
  
  // Addresses
  legalAddress: "Республика Казахстан, г. Астана, А32, дом 3, кв. 43",
  physicalAddress: "г. Астана, ул. Шамши Калдаякова, 1",
  city: "Astana",
  country: "KZ",
  
  // Contacts
  phoneWhatsApp: "+77078607779",
  phoneCallback: "+77077119952",
  phoneWhatsAppDisplay: "+7 707 860 77 79",
  phoneCallbackDisplay: "***REMOVED***",
  email: "Horecomkz@gmail.com",
  emailPrivacy: "Horecomkz@gmail.com",
  
  // Social
  instagram: "https://www.instagram.com/horecom.kz/",
  instagramHandle: "@horecom.kz",
  threads: "https://www.threads.com/@horecom.kz",
  whatsappLink: "https://api.whatsapp.com/send/?phone=77078607779",
  
  // Business
  yearFounded: 2016,
  
  // Operational
  minOrderKzt: 5000,
  freeDeliveryThresholdKzt: 30000,
  freeDeliveryThresholdSubscriptionKzt: 7000,
  paidDeliveryFeeKzt: 1000,
} as const;
