export type StaySearchParams = { city: string; nights: number; adults: number };

export type NormalizedStay = {
  id: string;
  city: string;
  name: string;
  nights: number;
  total: number;
  currency: string;
  provider: "mock";
};

export async function searchStays(
  params: StaySearchParams
): Promise<{ results: NormalizedStay[]; debug: any }> {
  const nights = Math.max(1, params.nights || 1);

  const results: NormalizedStay[] = [
    {
      id: "mock-stay-1",
      city: params.city,
      name: "Ecovira Mock Suites",
      nights,
      total: 180 * nights,
      currency: "AUD",
      provider: "mock",
    },
    {
      id: "mock-stay-2",
      city: params.city,
      name: "Harbour View Hotel (Mock)",
      nights,
      total: 240 * nights,
      currency: "AUD",
      provider: "mock",
    },
  ];

  return {
    results,
    debug: { mode: "mock", input: params },
  };
}