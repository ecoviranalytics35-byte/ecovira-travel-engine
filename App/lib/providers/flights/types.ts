import type { FlightResult } from "@/lib/core/types";

export type FlightSearchParams = {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
  currency?: string;
  tripType?: string;
};

export interface FlightProvider {
  readonly name: string;
  search(params: FlightSearchParams): Promise<{ results: FlightResult[]; meta?: Record<string, unknown>; errors: string[] }>;
  /** Minimal health check (e.g. token validation or a tiny API call). */
  healthCheck(): Promise<{ ok: boolean; message?: string; statusCode?: number; requestId?: string }>;
}
