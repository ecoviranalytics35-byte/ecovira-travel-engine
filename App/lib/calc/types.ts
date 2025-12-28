export type Money = { amount: number; currency: string };

export type QuoteInput = {
  base: Money;
  markupPct: number;
  fees: Money[];
  fxRate?: number;
  targetCurrency?: string;
};

export type QuoteOutput = {
  base: Money;
  sell: Money;
  profit: Money;
  breakdown: {
    markupAmount: Money;
    feesTotal: Money;
    fxApplied: boolean;
  };
};