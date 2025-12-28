import { fetchJson } from "@/lib/core/http";
import { getAmadeusToken } from "@/lib/stays/amadeus";

export interface AmadeusFlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  currencyCode?: string;
}

export async function searchAmadeusFlights(params: AmadeusFlightSearchParams): Promise<{ results: any[], debug: any }> {
  const token = await getAmadeusToken();

  const url = new URL("https://test.api.amadeus.com/v2/shopping/flight-offers");
  
  url.searchParams.set("originLocationCode", params.originLocationCode);
  url.searchParams.set("destinationLocationCode", params.destinationLocationCode);
  url.searchParams.set("departureDate", params.departureDate);
  url.searchParams.set("adults", params.adults.toString());
  
  if (params.returnDate) {
    url.searchParams.set("returnDate", params.returnDate);
  }
  if (params.children) {
    url.searchParams.set("children", params.children.toString());
  }
  if (params.infants) {
    url.searchParams.set("infants", params.infants.toString());
  }
  if (params.travelClass) {
    url.searchParams.set("travelClass", params.travelClass);
  }
  if (params.currencyCode) {
    url.searchParams.set("currencyCode", params.currencyCode);
  }
  url.searchParams.set("max", "10"); // Limit to 10 results

  const data = await fetchJson<{ data: any[], meta: any }>(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Normalize results
  const results = data.data.slice(0, 10).map((offer: any) => {
    const firstSegment = offer.itineraries[0]?.segments?.[0];
    const lastSegment = offer.itineraries[0]?.segments?.[offer.itineraries[0]?.segments?.length - 1];
    
    return {
      id: offer.id,
      from: firstSegment?.departure?.iataCode || params.originLocationCode,
      to: lastSegment?.arrival?.iataCode || params.destinationLocationCode,
      departDate: firstSegment?.departure?.at?.split('T')[0] || params.departureDate,
      price: offer.price?.total || "0.00",
      currency: offer.price?.currency || params.currencyCode || "USD",
      provider: "amadeus",
      raw: offer,
    };
  });

  return { results, debug: { count: results.length, meta: data.meta } };
}

