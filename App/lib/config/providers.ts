/**
 * Environment-driven provider configuration.
 * No hardcoded provider names in business logic — use these constants.
 */

const PRIMARY_FLIGHT = (process.env.PRIMARY_FLIGHT_PROVIDER || "duffel").toLowerCase();
const PRIMARY_HOTEL = (process.env.PRIMARY_HOTEL_PROVIDER || "liteapi").toLowerCase();

export const PROVIDER_NAMES = {
  FLIGHT: {
    DUFFEL: "duffel",
    AMADEUS: "amadeus",
  },
  HOTEL: {
    LITEAPI: "liteapi",
    AMADEUS: "amadeus",
  },
} as const;

export function getPrimaryFlightProvider(): string {
  return PRIMARY_FLIGHT;
}

export function getPrimaryHotelProvider(): string {
  return PRIMARY_HOTEL;
}

export function isDuffelPrimary(): boolean {
  return PRIMARY_FLIGHT === PROVIDER_NAMES.FLIGHT.DUFFEL;
}

export function isLiteApiPrimary(): boolean {
  return PRIMARY_HOTEL === PROVIDER_NAMES.HOTEL.LITEAPI;
}
