import { getPrimaryFlightProvider, PROVIDER_NAMES } from "@/lib/config/providers";
import type { FlightProvider } from "./types";
import { duffelFlightProvider } from "./duffel";
import { amadeusFlightProvider } from "./amadeus-adapter";

const providers: Record<string, FlightProvider> = {
  [PROVIDER_NAMES.FLIGHT.DUFFEL]: duffelFlightProvider,
  [PROVIDER_NAMES.FLIGHT.AMADEUS]: amadeusFlightProvider,
};

export function getFlightProvider(): FlightProvider {
  const primary = getPrimaryFlightProvider();
  const provider = providers[primary] ?? duffelFlightProvider;
  return provider;
}

export { duffelFlightProvider, amadeusFlightProvider };
export type { FlightProvider, FlightSearchParams } from "./types";
