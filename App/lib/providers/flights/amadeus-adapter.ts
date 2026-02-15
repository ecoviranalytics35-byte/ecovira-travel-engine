import { searchAmadeusFlights } from "@/lib/flights/amadeus";
import { getAmadeusToken } from "@/lib/stays/amadeus";
import type { FlightProvider, FlightSearchParams } from "./types";
import type { FlightResult } from "@/lib/core/types";

const travelClassMap: Record<string, string> = {
  economy: "ECONOMY",
  premium_economy: "PREMIUM_ECONOMY",
  business: "BUSINESS",
  first: "FIRST",
};

export const amadeusFlightProvider: FlightProvider = {
  name: "amadeus",

  async search(params: FlightSearchParams) {
    try {
      const amadeusParams = {
        originLocationCode: params.from,
        destinationLocationCode: params.to,
        departureDate: params.departDate,
        returnDate: params.returnDate,
        adults: params.adults,
        children: params.children,
        infants: params.infants,
        travelClass: travelClassMap[params.cabinClass || "economy"] || "ECONOMY",
        currencyCode: params.currency || "USD",
      };
      const { results: rawResults, debug } = await searchAmadeusFlights(amadeusParams);
      const results: FlightResult[] = rawResults.map((r: any) => ({ type: "flight", ...r }));
      return { results, meta: { debug }, errors: [] };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      return { results: [], meta: {}, errors: [error] };
    }
  },

  async healthCheck() {
    try {
      const token = await getAmadeusToken();
      return { ok: !!token };
    } catch {
      return { ok: false, message: "Amadeus token failed" };
    }
  },
};
