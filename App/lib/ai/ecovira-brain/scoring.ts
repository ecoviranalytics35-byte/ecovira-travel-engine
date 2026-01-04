import type { FlightOption } from "./types";

function safeNum(n?: number, fallback = 0) {
  return Number.isFinite(n as number) ? (n as number) : fallback;
}

function totalDurationMins(opt: FlightOption): number {
  // Prefer itinerary duration if provided; else sum segments.
  const it = opt.itineraries?.[0];
  if (it?.durationMins) return it.durationMins;
  const segSum =
    it?.segments?.reduce((acc, s) => acc + safeNum(s.durationMins, 0), 0) ?? 0;
  return segSum;
}

function stopsCount(opt: FlightOption): number {
  const it = opt.itineraries?.[0];
  if (typeof it?.stops === "number") return it.stops;
  const segCount = it?.segments?.length ?? 1;
  return Math.max(0, segCount - 1);
}

export type ScoredOption = {
  option: FlightOption;
  score: number; // higher better
  reasons: string[];
};

export function rankFlights(options: FlightOption[]): ScoredOption[] {
  if (!options?.length) return [];

  // Normalize price to AUD-like numeric scoring (lower price better).
  const prices = options.map((o) => safeNum(o.price.amount, 0));
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  const durations = options.map((o) => totalDurationMins(o));
  const minD = Math.min(...durations);
  const maxD = Math.max(...durations);

  const scored: ScoredOption[] = options.map((o) => {
    const p = safeNum(o.price.amount, 0);
    const d = totalDurationMins(o);
    const s = stopsCount(o);

    const priceScore =
      maxP === minP ? 1 : 1 - (p - minP) / (maxP - minP); // 0..1
    const durScore =
      maxD === minD ? 1 : 1 - (d - minD) / (maxD - minD); // 0..1
    const stopScore = 1 / (1 + s); // direct=1, 1 stop=0.5, etc.
    const flexBonus =
      (o.refundable ? 0.12 : 0) + (o.changeable ? 0.06 : 0);

    // Weighted blend: premium users like value + time + directness
    const score = priceScore * 0.48 + durScore * 0.32 + stopScore * 0.2 + flexBonus;

    const reasons: string[] = [];
    if (s === 0) reasons.push("Direct routing");
    if (o.refundable) reasons.push("Refundable fare");
    if (o.changeable) reasons.push("Changeable fare");
    if (priceScore > 0.8) reasons.push("Strong price vs alternatives");
    if (durScore > 0.8) reasons.push("Shorter travel time");

    return { option: o, score, reasons };
  });

  return scored.sort((a, b) => b.score - a.score);
}

