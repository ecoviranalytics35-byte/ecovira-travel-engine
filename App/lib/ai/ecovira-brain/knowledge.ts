export const ECOVIRA_CONTACT = {
  email: "ecoviranalytics35@mgail.com",
};

export const CURRENCY_KNOWLEDGE = {
  whatMatters: [
    "Card provider FX rate (Visa/Mastercard/Amex) vs bank markup",
    "Dynamic Currency Conversion (DCC) – often worse rate, avoid when offered",
    "Payment processing fee differences by payment rail/currency",
    "Refund currency risk: refunds may return in original charged currency",
    "Crypto: network fees + price volatility + settlement timing",
  ],
  rulesOfThumb: [
    "If you have an Australian card, paying in AUD often reduces surprises.",
    "If paying in a foreign currency, your bank sets the FX rate + markup — sometimes cheaper, sometimes not.",
    "Avoid DCC when a terminal/website offers it; choose the airline/merchant currency if possible.",
  ],
  disclaimer: "This is general guidance — final FX depends on your bank/card and the payment provider.",
};

export const ECOVIRA_KNOWLEDGE = {
  brandVoice: {
    style: "premium_concierge",
    rules: [
      "Be confident, warm, and practical.",
      "Avoid generic filler. No long lectures.",
      "Use short paragraphs, bullet points when helpful.",
      "Always: Answer → Why → Next step.",
      "Ask at most ONE follow-up question if required.",
      "Never request passport numbers, full card details, or sensitive IDs.",
    ],
  },

  safety: {
    neverAsk: [
      "passport numbers",
      "full card numbers",
      "CVV",
      "full DOB",
      "government ID",
    ],
  },

  feesExplainer: [
    "Ecovira shows total prices upfront before you pay.",
    "Totals can include: airline fare + taxes + any airline-issued surcharges + payment processing (if applicable) + Ecovira service fee (if applicable).",
    "Some add-ons (bags, seats, insurance) may appear during checkout depending on airline and fare type.",
  ],

  refundsExplainer: [
    "Refundability depends on the fare rules (airline + fare brand).",
    "Non-refundable fares may still allow changes with a fee or fare difference.",
    "If you share the airline + fare type (or a booking reference), Ecovira can guide the best option.",
  ],

  baggageExplainer: [
    "Baggage rules depend on airline, route, and fare brand.",
    "Carry-on is often included; checked baggage may be extra on basic fares.",
    "Seat selection may be paid on some fares (even if baggage is included).",
  ],

  bestOptionCriteria: [
    "Lowest total price (not just base fare)",
    "Total duration",
    "Stops (direct preferred)",
    "Airline reliability preference (if known)",
    "Refund/change flexibility",
    "Arrival time suitability",
  ],

  defaultQuickChips: [
    "Best option?",
    "Fees?",
    "Refunds?",
    "Baggage?",
    "Seat selection?",
    "Currency/Crypto?",
  ],
} as const;

