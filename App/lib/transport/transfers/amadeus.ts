import { fetchJson } from "@/lib/core/http";
import { getAmadeusToken } from "@/lib/stays/amadeus";

export interface TransferSearchParams {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  dateTime: string;
  adults: number;
}

export async function searchTransfers(params: TransferSearchParams): Promise<any[]> {
  const token = await getAmadeusToken();

  const url = "https://test.api.amadeus.com/v2/shopping/transfer-offers";
  const body = {
    startGeoCode: {
      latitude: params.startLat,
      longitude: params.startLng,
    },
    endGeoCode: {
      latitude: params.endLat,
      longitude: params.endLng,
    },
    transferType: "PRIVATE",
    startDateTime: params.dateTime,
    passengers: [
      {
        type: "ADULT",
        count: params.adults,
      },
    ],
  };

  const data = await fetchJson<{ data: any[] }>(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // Normalize results
  const results: any[] = data.data.slice(0, 10).map((offer) => ({
    id: offer.id,
    from: offer.start.address?.line1 || `${params.startLat},${params.startLng}`,
    to: offer.end.address?.line1 || `${params.endLat},${params.endLng}`,
    dateTime: offer.start.dateTime,
    total: offer.price.total,
    currency: offer.price.currency,
    provider: "amadeus",
  }));

  return results;
}