import { QuoteInput, QuoteOutput } from "./types";
import { calcMarkupAmount, calcProfit } from "./profit";
import { applyFx } from "./fx";

export function buildQuote(input: QuoteInput): QuoteOutput {
  if (input.markupPct < 0) {
    throw new Error("Markup percentage must be >= 0");
  }

  let baseAmount = input.base.amount;
  let baseCurrency = input.base.currency;
  let fxApplied = false;

  if (input.fxRate && input.targetCurrency) {
    baseAmount = applyFx(baseAmount, input.fxRate);
    baseCurrency = input.targetCurrency;
    fxApplied = true;
  }

  const feesTotal = input.fees.reduce((sum, fee) => sum + fee.amount, 0);

  const markupAmount = calcMarkupAmount(baseAmount, input.markupPct);

  const sellAmount = baseAmount + markupAmount + feesTotal;

  const profitAmount = calcProfit(sellAmount, baseAmount, feesTotal);

  return {
    base: { amount: baseAmount, currency: baseCurrency },
    sell: { amount: sellAmount, currency: baseCurrency },
    profit: { amount: profitAmount, currency: baseCurrency },
    breakdown: {
      markupAmount: { amount: markupAmount, currency: baseCurrency },
      feesTotal: { amount: feesTotal, currency: baseCurrency },
      fxApplied,
    },
  };
}