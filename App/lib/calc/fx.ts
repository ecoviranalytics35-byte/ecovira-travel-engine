export function applyFx(amount: number, fxRate?: number): number {
  if (fxRate) {
    return amount * fxRate;
  }
  return amount;
}