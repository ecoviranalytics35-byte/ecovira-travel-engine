export type StaySearchParams = { city: string; checkIn: string; nights: number; adults: number; children?: number; rooms?: number; currency?: string; budgetPerNight?: string };

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
  const results: NormalizedStay[] = [
    {
      id: "mock-stay-1",
      city: params.city,
      name: "Ecovira Mock Suites",
      nights: params.nights,
      total: params.nights * 150,
      currency: params.currency || "AUD",
      provider: "mock",
    },
    {
      id: "mock-stay-2",
      city: params.city,
      name: "Harbour View Hotel (Mock)",
      nights: params.nights,
      total: params.nights * 150,
      currency: params.currency || "AUD",
      provider: "mock",
    },
  ];

  return {
    results,
    debug: { mode: "mock", input: params },
  };
}