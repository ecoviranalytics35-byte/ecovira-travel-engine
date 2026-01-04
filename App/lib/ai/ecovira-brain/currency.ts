import type { TripContext } from "./types";

type CurrencyAdviceInput = {
  userCurrency?: string;       // e.g. "AUD"
  chargeCurrency?: string;     // e.g. "USD"
  userLocation?: string;       // optional
  paymentMethod?: "card" | "crypto" | "unknown";
};

export function currencyAdvisor(ctx?: TripContext, rawMsg?: string): string {
  const userCurrency = ctx?.currency || "AUD";

  // Lightweight inference from message text
  const msg = (rawMsg || "").toLowerCase();
  const paymentMethod =
    msg.includes("crypto") ? "crypto" :
    msg.includes("card") || msg.includes("visa") || msg.includes("mastercard") ? "card" :
    "unknown";

  const lines: string[] = [];

  lines.push(`Here's how to choose the best currency to pay in (the "mini Google" version):`);
  lines.push(``);
  lines.push(`**Answer**`);
  lines.push(
    paymentMethod === "crypto"
      ? `If you're paying by **crypto**, focus on total cost = checkout total + network fee + volatility risk.`
      : `If you're paying by **card**, the best currency depends on your bank's FX markup and whether DCC is being applied.`
  );

  lines.push(``);
  lines.push(`**Why**`);
  lines.push(`- **Avoid DCC** (Dynamic Currency Conversion). If you see "Pay in AUD?" on an international checkout, it's often a worse rate.`);
  lines.push(`- Paying in **${userCurrency}** reduces surprises, but isn't always the cheapest if your bank has low FX fees.`);
  lines.push(`- Paying in the **merchant/airline currency** can be cheaper when your card FX rates are strong.`);
  lines.push(`- Refunds usually return in the original charged currency — FX can change between purchase and refund.`);

  lines.push(``);
  lines.push(`**Next step**`);
  lines.push(
    `Tell me: (1) are you paying by **card or crypto**, and (2) does your card charge **foreign transaction fees**?`
  );

  return lines.join("\n");
}

