import type { FlightProvider } from "./types";
import type { FlightResult } from "@/lib/core/types";

const BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

/**
 * Duffel account must have "sources" enabled for the markets you search.
 * If MEL->SYD consistently returns 0 offers, check Duffel dashboard: ensure
 * sources are enabled for the relevant content/region.
 */

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
  const token = (process.env.DUFFEL_ACCESS_TOKEN ?? "").trim();
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
    Authorization: `Bearer ${token.trim()}`,
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

  const rawText = await res.text();
  const redacted = rawText.replace(/\bBearer\s+[A-Za-z0-9_-]+/gi, "Bearer [REDACTED]").replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"[REDACTED]"');
  structuredLog("info", {
    event: "duffel_response",
    requestId,
    statusCode,
    path,
    responsePreview: redacted.slice(0, 500),
  });

  let data: T;
  try {
    data = JSON.parse(rawText) as T;
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

  return { data, requestId, statusCode };
}

export const duffelFlightProvider: FlightProvider = {
  name: "duffel",

  async search(params) {
    const requestId = newRequestId();
    const origin = String(params.from ?? "").trim().toUpperCase().slice(0, 3);
    const destination = String(params.to ?? "").trim().toUpperCase().slice(0, 3);
    const departure_date = String(params.departDate ?? "").trim();

    try {
      const slices: { origin: string; destination: string; departure_date: string }[] = [
        { origin, destination, departure_date },
      ];
      const isRoundtrip = params.tripType === "return" || params.tripType === "roundtrip";
      if (isRoundtrip && params.returnDate) {
        slices.push({
          origin: destination,
          destination: origin,
          departure_date: String(params.returnDate).trim(),
        });
      }

      const passengers: { type: string }[] = [];
      const adultCount = Math.max(1, params.adults || 1);
      for (let i = 0; i < adultCount; i++) passengers.push({ type: "adult" });
      for (let i = 0; i < (params.children || 0); i++) passengers.push({ type: "child" });
      for (let i = 0; i < (params.infants || 0); i++) passengers.push({ type: "infant_without_seat" });

      const body = {
        data: {
          slices,
          passengers,
          cabin_class: params.cabinClass || "economy",
        },
      };

      structuredLog("info", {
        event: "duffel_offer_request_payload",
        requestId,
        origin,
        destination,
        departure_date,
        return_date: isRoundtrip ? params.returnDate : null,
        passengers,
        cabin_class: body.data.cabin_class,
      });

      const res = await duffelFetch<{
        data?: { id?: string; offers?: Array<{ id?: string; total_amount?: string; total_currency?: string; base_amount?: string; base_currency?: string }> };
        offers?: Array<{ id?: string; total_amount?: string; total_currency?: string; base_amount?: string; base_currency?: string }>;
      }>("/air/offer_requests?return_offers=true", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = res.data as any;
      const dataOffers = Array.isArray(data?.data?.offers) ? data.data.offers : [];
      const topLevelOffers = Array.isArray(data?.offers) ? data.offers : [];
      const offers = dataOffers.length > 0 ? dataOffers : topLevelOffers;

      structuredLog("info", {
        event: "duffel_response_structure",
        requestId,
        statusCode: res.statusCode,
        responseTopLevelKeys: data ? Object.keys(data) : [],
        dataDataKeys: data?.data ? Object.keys(data.data) : [],
        dataDataOffersLength: dataOffers.length,
        dataOffersLength: topLevelOffers.length,
        offersUsed: offers.length,
      });

      const results: FlightResult[] = offers.slice(0, 10).map((offer: any, index: number) => {
        const offerId =
          offer.id || `duffel-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
        const amount = offer.total_amount ?? offer.base_amount ?? "0";
        const curr = offer.total_currency ?? offer.base_currency ?? params.currency ?? "USD";
        return {
          type: "flight",
          id: offerId,
          from: origin,
          to: destination,
          departDate: departure_date,
          price: String(amount),
          currency: curr,
          provider: "duffel",
          raw: offer,
        };
      });

      const paxCount = passengers.length;
      structuredLog("info", {
        event: "duffel_search",
        origin,
        destination,
        departure_date,
        paxCount,
        statusCode: res.statusCode,
        offersCount: results.length,
        requestId,
      });

      return {
        results,
        meta: { requestId, offerRequestId: data?.data?.id, count: results.length },
        errors: [],
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      structuredLog("error", {
        event: "duffel_search",
        requestId,
        origin,
        destination,
        departure_date,
        paxCount: 0,
        statusCode: null,
        offersCount: 0,
        errorBody: message,
      });
      return { results: [], meta: { requestId }, errors: [message] };
    }
  },

  async healthCheck() {
    const requestId = newRequestId();
    if (!(process.env.DUFFEL_ACCESS_TOKEN ?? "").trim()) {
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
