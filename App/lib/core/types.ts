export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = { ok: false; error: string };

export type FlightSearchParams = { from: string; to: string; departDate: string; adults: number };
export type FlightResult = { id: string; from: string; to: string; departDate: string; price: string | number; currency: string; provider: string };

export type StaySearchParams = { city: string; checkIn: string; nights: number; adults: number };
export type StayResult = { id: string; city: string; name: string; checkIn: string; nights: number; roomType: string; classType: string; total: string | number; currency: string; provider: string };