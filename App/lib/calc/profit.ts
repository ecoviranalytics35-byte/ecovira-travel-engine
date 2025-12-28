export function calcMarkupAmount(baseAmount: number, markupPct: number): number {
  return baseAmount * (markupPct / 100);
}

export function calcProfit(sell: number, base: number, fees: number): number {
  return sell - base - fees;
}