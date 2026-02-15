import { getPrimaryHotelProvider, PROVIDER_NAMES } from "@/lib/config/providers";
import type { StaysProvider } from "@/lib/stays/provider";
import { liteApiStaysProvider } from "./liteapi";
import { amadeusStaysProvider } from "@/lib/stays/amadeus-provider";
import { mockStaysProvider } from "@/lib/stays/provider";

const providers: Record<string, StaysProvider> = {
  [PROVIDER_NAMES.HOTEL.LITEAPI]: liteApiStaysProvider,
  [PROVIDER_NAMES.HOTEL.AMADEUS]: amadeusStaysProvider,
};

export function getHotelProvider(): StaysProvider {
  const primary = getPrimaryHotelProvider();
  const provider = providers[primary];
  if (provider) return provider;
  if (process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET) {
    return amadeusStaysProvider;
  }
  return mockStaysProvider;
}

export { liteApiStaysProvider };
export { liteApiHealthCheck } from "./liteapi";
