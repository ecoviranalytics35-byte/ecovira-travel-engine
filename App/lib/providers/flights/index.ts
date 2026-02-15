import { getPrimaryFlightProvider, PROVIDER_NAMES } from "@/lib/config/providers";
import type { FlightProvider } from "./types";
import { duffelFlightProvider } from "./duffel";

const providers: Record<string, FlightProvider> = {
  [PROVIDER_NAMES.FLIGHT.DUFFEL]: duffelFlightProvider,
};

export function getFlightProvider(): FlightProvider {
  const primary = getPrimaryFlightProvider();
  return providers[primary] ?? duffelFlightProvider;
}

export { duffelFlightProvider };
export type { FlightProvider, FlightSearchParams } from "./types";
