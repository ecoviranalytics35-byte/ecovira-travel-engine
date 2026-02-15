import type { FlightProvider } from "./types";
import type { FlightResult } from "@/lib/core/types";

const BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

function newRequestId(): string {
  return `duf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function structuredLog(level: "info" | "warn" | "error", payload: Record<string, unknown>): void {
  const log = { level, ...payload, timestamp: new Date().toISOString() };
  if (level === "error") {
    console.error(JSON.stringify(log));
  } else if (level === "warn") {
    console.warn(JSON.stringify(log));
  } else {
    console.log(JSON.stringify(log));
  }
}

async function duffelFetch<T = unknown>(
  path: string,
  init: RequestInit & { method?: string; body?: string }
): Promise<{ data: T; requestId: string; statusCode: number }> {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    structuredLog("error", {
      event: "duffel_config",
      message: "DUFFEL_ACCESS_TOKEN is not set",
      requestId: null,
    });
    throw new Error("Duffel access token missing. Set DUFFEL_ACCESS_TOKEN.");
  }

  const requestId = newRequestId();
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Duffel-Version": DUFFEL_VERSION,
    Accept: "application/json",
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip",
  };

  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string>) },
  });

  const statusCode = res.status;
  let errorBody: string | null = null;
  if (!res.ok) {
    try {
      errorBody = await res.text();
    } catch {
      errorBody = null;
    }
    structuredLog("error", {
      event: "duffel_request",
      requestId,
      statusCode,
      errorBody: errorBody ?? undefined,
      path,
    });
    throw new Error(
      `Duffel API error: ${statusCode}${errorBody ? ` — ${errorBody.slice(0, 200)}` : ""}`
    );
  }

  let data: T;
  try {
    data = (await res.json()) as T;
  } catch (e) {
    errorBody = e instanceof Error ? e.message : String(e);
    structuredLog("error", {
      event: "duffel_parse",
      requestId,
      statusCode,
      errorBody,
      path,
    });
    throw new Error(`Duffel response parse error: ${errorBody}`);
  }

  structuredLog("info", {
    event: "duffel_request",
    requestId,
    statusCode,
    path,
  });
  return { data, requestId, statusCode };
}

export const duffelFlightProvider: FlightProvider = {
  name: "duffel",

  async search(params) {
    const requestId = newRequestId();
    try {
      const slices: { origin: string; destination: string; departure_date: string }[] = [
        { origin: params.from, destination: params.to, departure_date: params.departDate },
      ];
      if (params.tripType === "return" && params.returnDate) {
        slices.push({
          origin: params.to,
          destination: params.from,
          departure_date: params.returnDate,
        });
      }

      const passengers: { type: string }[] = [];
      for (let i = 0; i < (params.adults || 1); i++) passengers.push({ type: "adult" });
      for (let i = 0; i < (params.children || 0); i++) passengers.push({ type: "child" });
      for (let i = 0; i < (params.infants || 0); i++) passengers.push({ type: "infant_without_seat" });

      const body = {
        data: {
          slices,
          passengers,
          cabin_class: params.cabinClass || "economy",
        },
      };

      const { data, statusCode } = await duffelFetch<{
        data: { id: string; offers?: Array<{ id: string; total_amount: string; total_currency: string }> };
      }>("/air/offer_requests?return_offers=true", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const offers = data.data?.offers ?? [];
      const results: FlightResult[] = offers.slice(0, 10).map((offer: any, index: number) => {
        const offerId =
          offer.id || `duffel-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
        return {
          type: "flight",
          id: offerId,
          from: params.from,
          to: params.to,
          departDate: params.departDate,
          price: offer.total_amount ?? "0",
          currency: offer.total_currency ?? params.currency ?? "USD",
          provider: "duffel",
          raw: offer,
        };
      });

      structuredLog("info", {
        event: "duffel_search",
        requestId,
        statusCode,
        offerRequestId: data.data?.id,
        count: results.length,
      });
      return {
        results,
        meta: { requestId, offerRequestId: data.data?.id, count: results.length },
        errors: [],
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      structuredLog("error", {
        event: "duffel_search",
        requestId,
        errorBody: message,
      });
      return { results: [], meta: { requestId }, errors: [message] };
    }
  },

  async healthCheck() {
    const requestId = newRequestId();
    if (!process.env.DUFFEL_ACCESS_TOKEN) {
      structuredLog("error", {
        event: "duffel_health",
        requestId,
        message: "DUFFEL_ACCESS_TOKEN not set",
      });
      return { ok: false, message: "DUFFEL_ACCESS_TOKEN not set", requestId };
    }
    try {
      // Minimal test: list airlines (lightweight)
      const { statusCode } = await duffelFetch<unknown>("/air/airlines", { method: "GET" });
      return { ok: true, statusCode, requestId };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      structuredLog("error", {
        event: "duffel_health",
        requestId,
        errorBody: message,
      });
      return { ok: false, message, requestId };
    }
  },
};
