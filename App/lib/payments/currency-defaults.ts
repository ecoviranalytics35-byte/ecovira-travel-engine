/**
 * Country to currency mapping for auto-detection
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Major countries
  AU: "AUD", // Australia
  US: "USD", // United States
  GB: "GBP", // United Kingdom
  CA: "CAD", // Canada
  NZ: "NZD", // New Zealand
  JP: "JPY", // Japan
  CH: "CHF", // Switzerland
  CN: "CNY", // China
  HK: "HKD", // Hong Kong
  SG: "SGD", // Singapore
  AE: "AED", // UAE
  TR: "TRY", // Turkey
  TH: "THB", // Thailand
  
  // EU countries (Eurozone)
  AT: "EUR", // Austria
  BE: "EUR", // Belgium
  CY: "EUR", // Cyprus
  EE: "EUR", // Estonia
  FI: "EUR", // Finland
  FR: "EUR", // France
  DE: "EUR", // Germany
  GR: "EUR", // Greece
  IE: "EUR", // Ireland
  IT: "EUR", // Italy
  LV: "EUR", // Latvia
  LT: "EUR", // Lithuania
  LU: "EUR", // Luxembourg
  MT: "EUR", // Malta
  NL: "EUR", // Netherlands
  PT: "EUR", // Portugal
  SK: "EUR", // Slovakia
  SI: "EUR", // Slovenia
  ES: "EUR", // Spain
  
  // Other countries
  IN: "INR", // India
  KR: "KRW", // South Korea
  MX: "MXN", // Mexico
  BR: "BRL", // Brazil
  ZA: "ZAR", // South Africa
  SE: "SEK", // Sweden
  NO: "NOK", // Norway
  DK: "DKK", // Denmark
  PL: "PLN", // Poland
  CZ: "CZK", // Czech Republic
  HU: "HUF", // Hungary
  ID: "IDR", // Indonesia
  MY: "MYR", // Malaysia
  PH: "PHP", // Philippines
  VN: "VND", // Vietnam
};

/**
 * Get default currency for a country code
 */
export function getCurrencyForCountry(countryCode: string | null): string {
  if (!countryCode) return "AUD"; // Default fallback
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || "AUD";
}

/**
 * Get currency from browser locale (client-side fallback)
 */
export function getCurrencyFromLocale(): string {
  if (typeof window === "undefined") return "AUD";
  
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split("-")[1]?.toUpperCase();
    if (region) {
      return getCurrencyForCountry(region);
    }
  } catch (err) {
    console.error("[Currency] Failed to get currency from locale:", err);
  }
  
  return "AUD";
}

