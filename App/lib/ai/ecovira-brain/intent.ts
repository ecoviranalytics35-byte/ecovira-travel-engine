export type Intent =
  | "fees"
  | "refunds"
  | "baggage"
  | "seats"
  | "best_option"
  | "booking_reference"
  | "airport_search"
  | "payments_currency_crypto"
  | "contact_support"
  | "general_help";

const normalize = (s: string) =>
  s.toLowerCase().replace(/\s+/g, " ").trim();

const hasAny = (text: string, phrases: string[]) =>
  phrases.some((p) => text.includes(p));

export function detectIntent(userMessage: string): { intent: Intent; confidence: number } {
  const t = normalize(userMessage);

  const rules: Array<{ intent: Intent; score: number; match: boolean }> = [
    {
      intent: "fees",
      score: 0.95,
      match: hasAny(t, ["fee", "fees", "charge", "charges", "service fee", "processing", "total price", "breakdown"]),
    },
    {
      intent: "refunds",
      score: 0.93,
      match: hasAny(t, ["refund", "refundable", "cancellation", "cancel", "money back", "change flight", "change fee"]),
    },
    {
      intent: "baggage",
      score: 0.92,
      match: hasAny(t, ["baggage", "bag", "bags", "checked", "carry on", "carry-on", "luggage"]),
    },
    {
      intent: "seats",
      score: 0.9,
      match: hasAny(t, ["seat", "seats", "seat selection", "choose seat", "aisle", "window"]),
    },
    {
      intent: "best_option",
      score: 0.9,
      match: hasAny(t, ["best option", "which one", "recommend", "best flight", "cheapest and best", "best value"]),
    },
    {
      intent: "booking_reference",
      score: 0.88,
      match: hasAny(t, ["booking reference", "pnr", "reference", "my booking", "already booked", "ticket confirmed"]),
    },
    {
      intent: "airport_search",
      score: 0.85,
      match: hasAny(t, ["airport", "iata", "city code", "not showing airports", "search airport", "only melbourne"]),
    },
    {
      intent: "contact_support",
      score: 0.95,
      match: hasAny(t, ["contact", "support", "email", "help", "reach", "get in touch", "customer service", "ecovira contact"]),
    },
    {
      intent: "payments_currency_crypto",
      score: 0.85,
      match: hasAny(t, [
        "crypto", "currency", "pay in", "aud", "usd", "eur", "gbp", "try", "thb", "inr",
        "exchange", "fx", "conversion", "rate", "rates", "cheaper currency", "best currency",
        "dynamic currency conversion", "dcc", "bank fee", "visa rate", "mastercard rate"
      ]),
    },
  ];

  const hit = rules.find((r) => r.match);
  if (hit) return { intent: hit.intent, confidence: hit.score };
  return { intent: "general_help", confidence: 0.55 };
}

