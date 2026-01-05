/**
 * Stripe-supported currencies
 * Source: https://stripe.com/docs/currencies
 * 
 * Format: ISO 4217 currency codes
 * Note: Stripe supports 135+ currencies
 */

export const STRIPE_SUPPORTED_CURRENCIES = [
  // Major currencies (popular)
  'AUD', // Australian Dollar
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'JPY', // Japanese Yen
  'CAD', // Canadian Dollar
  'CHF', // Swiss Franc
  'CNY', // Chinese Yuan
  'HKD', // Hong Kong Dollar
  'NZD', // New Zealand Dollar
  'SGD', // Singapore Dollar
  'AED', // UAE Dirham
  'TRY', // Turkish Lira
  'THB', // Thai Baht
  
  // Additional currencies
  'AFN', // Afghan Afghani
  'ALL', // Albanian Lek
  'DZD', // Algerian Dinar
  'ARS', // Argentine Peso
  'AMD', // Armenian Dram
  'AWG', // Aruban Florin
  'AZN', // Azerbaijani Manat
  'BSD', // Bahamian Dollar
  'BHD', // Bahraini Dinar
  'BDT', // Bangladeshi Taka
  'BBD', // Barbadian Dollar
  'BYN', // Belarusian Ruble
  'BZD', // Belize Dollar
  'BMD', // Bermudian Dollar
  'BTN', // Bhutanese Ngultrum
  'BOB', // Bolivian Boliviano
  'BAM', // Bosnia and Herzegovina Convertible Mark
  'BWP', // Botswana Pula
  'BRL', // Brazilian Real
  'BND', // Brunei Dollar
  'BGN', // Bulgarian Lev
  'BIF', // Burundian Franc
  'KHR', // Cambodian Riel
  'CVE', // Cape Verdean Escudo
  'KYD', // Cayman Islands Dollar
  'XAF', // Central African CFA Franc
  'XPF', // CFP Franc
  'CLP', // Chilean Peso
  'COP', // Colombian Peso
  'KMF', // Comorian Franc
  'CDF', // Congolese Franc
  'CRC', // Costa Rican Colón
  'HRK', // Croatian Kuna
  'CZK', // Czech Koruna
  'DKK', // Danish Krone
  'DJF', // Djiboutian Franc
  'DOP', // Dominican Peso
  'XCD', // East Caribbean Dollar
  'EGP', // Egyptian Pound
  'ERN', // Eritrean Nakfa
  'ETB', // Ethiopian Birr
  'FJD', // Fijian Dollar
  'GMD', // Gambian Dalasi
  'GEL', // Georgian Lari
  'GHS', // Ghanaian Cedi
  'GTQ', // Guatemalan Quetzal
  'GNF', // Guinean Franc
  'GYD', // Guyanaese Dollar
  'HTG', // Haitian Gourde
  'HNL', // Honduran Lempira
  'HUF', // Hungarian Forint
  'ISK', // Icelandic Króna
  'INR', // Indian Rupee
  'IDR', // Indonesian Rupiah
  'ILS', // Israeli New Sheqel
  'IQD', // Iraqi Dinar
  'JMD', // Jamaican Dollar
  'JOD', // Jordanian Dinar
  'KZT', // Kazakhstani Tenge
  'KES', // Kenyan Shilling
  'KWD', // Kuwaiti Dinar
  'KGS', // Kyrgystani Som
  'LAK', // Laotian Kip
  'LBP', // Lebanese Pound
  'LSL', // Lesotho Loti
  'LRD', // Liberian Dollar
  'LYD', // Libyan Dinar
  'MOP', // Macanese Pataca
  'MKD', // Macedonian Denar
  'MGA', // Malagasy Ariary
  'MWK', // Malawian Kwacha
  'MYR', // Malaysian Ringgit
  'MVR', // Maldivian Rufiyaa
  'MUR', // Mauritian Rupee
  'MXN', // Mexican Peso
  'MDL', // Moldovan Leu
  'MNT', // Mongolian Tugrik
  'MAD', // Moroccan Dirham
  'MZN', // Mozambican Metical
  'MMK', // Myanmar Kyat
  'NAD', // Namibian Dollar
  'NPR', // Nepalese Rupee
  'ANG', // Netherlands Antillean Guilder
  'NIO', // Nicaraguan Córdoba
  'NGN', // Nigerian Naira
  'NOK', // Norwegian Krone
  'OMR', // Omani Rial
  'PKR', // Pakistani Rupee
  'PAB', // Panamanian Balboa
  'PGK', // Papua New Guinean Kina
  'PYG', // Paraguayan Guaraní
  'PEN', // Peruvian Nuevo Sol
  'PHP', // Philippine Peso
  'PLN', // Polish Zloty
  'QAR', // Qatari Rial
  'RON', // Romanian Leu
  'RUB', // Russian Ruble
  'RWF', // Rwandan Franc
  'SHP', // Saint Helena Pound
  'WST', // Samoan Tala
  'STD', // São Tomé and Príncipe Dobra
  'SAR', // Saudi Riyal
  'RSD', // Serbian Dinar
  'SCR', // Seychellois Rupee
  'SLE', // Sierra Leonean Leone
  'SBD', // Solomon Islands Dollar
  'ZAR', // South African Rand
  'KRW', // South Korean Won
  'LKR', // Sri Lankan Rupee
  'SRD', // Surinamese Dollar
  'SZL', // Swazi Lilangeni
  'SEK', // Swedish Krona
  'TJS', // Tajikistani Somoni
  'TZS', // Tanzanian Shilling
  'TWD', // Taiwan New Dollar
  'TOP', // Tongan Paʻanga
  'TTD', // Trinidad and Tobago Dollar
  'TND', // Tunisian Dinar
  'UGX', // Ugandan Shilling
  'UAH', // Ukrainian Hryvnia
  'UYU', // Uruguayan Peso
  'UZS', // Uzbekistan Som
  'VUV', // Vanuatu Vatu
  'VND', // Vietnamese Dong
  'XOF', // West African CFA Franc
  'YER', // Yemeni Rial
  'ZMW', // Zambian Kwacha
  'ZWL', // Zimbabwean Dollar
] as const;

/**
 * Popular currencies for quick selection
 */
export const POPULAR_CURRENCIES = [
  'AUD',
  'USD',
  'EUR',
  'GBP',
  'TRY',
  'THB',
  'AED',
  'SGD',
  'NZD',
  'CAD',
  'CHF',
  'HKD',
  'JPY',
] as const;

/**
 * Currency minor unit mapping
 * Stripe requires amounts in the smallest currency unit
 * 
 * Most currencies: 2 decimal places (multiply by 100)
 * Zero decimal: 0 decimal places (no multiplication)
 * Three decimal: 3 decimal places (multiply by 1000)
 * 
 * Source: https://stripe.com/docs/currencies
 */
export const MINOR_UNITS_BY_CURRENCY: Record<string, number> = {
  // Zero decimal currencies
  'BIF': 1,
  'CLP': 1,
  'DJF': 1,
  'GNF': 1,
  'JPY': 1,
  'KMF': 1,
  'KRW': 1,
  'MGA': 1,
  'PYG': 1,
  'RWF': 1,
  'UGX': 1,
  'VND': 1,
  'VUV': 1,
  'XAF': 1,
  'XOF': 1,
  'XPF': 1,
  
  // Three decimal currencies
  'BHD': 1000,
  'JOD': 1000,
  'KWD': 1000,
  'OMR': 1000,
  'TND': 1000,
  
  // All others are 2 decimal (multiply by 100)
};

/**
 * Get the minor unit multiplier for a currency
 * Returns the number to multiply the amount by to get the smallest unit
 */
export function minorUnitForCurrency(currency: string): number {
  const code = currency.toUpperCase();
  return MINOR_UNITS_BY_CURRENCY[code] ?? 100; // Default to 100 (2 decimal places)
}

/**
 * Convert amount to Stripe's unit_amount (smallest currency unit)
 */
export function toStripeUnitAmount(amount: number, currency: string): number {
  const multiplier = minorUnitForCurrency(currency);
  return Math.round(amount * multiplier);
}

/**
 * Convert from Stripe's unit_amount back to display amount
 */
export function fromStripeUnitAmount(unitAmount: number, currency: string): number {
  const multiplier = minorUnitForCurrency(currency);
  return unitAmount / multiplier;
}

