import { fetchJson } from "@/lib/core/http";
import { getAmadeusToken } from "@/lib/stays/amadeus";

export interface CarSearchParams {
  pickupLat: number;
  pickupLng: number;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  driverAge: number;
  currency?: string;
}

export async function searchCars(params: CarSearchParams): Promise<any[]> {
  const token = await getAmadeusToken();

  const url = new URL("https://test.api.amadeus.com/v3/shopping/car-rental-offers");
  url.searchParams.set("pickUpLocation", `${params.pickupLat},${params.pickupLng}`);
  url.searchParams.set("dropOffLocation", `${params.pickupLat},${params.pickupLng}`); // Assuming same for simplicity
  url.searchParams.set("pickUpDate", params.pickupDate);
  url.searchParams.set("pickUpTime", params.pickupTime);
  url.searchParams.set("dropOffDate", params.dropoffDate);
  url.searchParams.set("dropOffTime", params.dropoffTime);
  url.searchParams.set("driverAge", params.driverAge.toString());
  if (params.currency) {
    url.searchParams.set("currency", params.currency);
  }

  const data = await fetchJson<{ data: any[] }>(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Normalize results
  const results: any[] = data.data.slice(0, 10).map((offer) => ({
    id: offer.id,
    vendor: offer.provider?.name || "Unknown",
    vehicle: offer.vehicle?.type || "Car",
    transmission: offer.vehicle?.transmission || "Automatic",
    fuel: offer.vehicle?.fuel || "Petrol",
    seats: offer.vehicle?.seats || 5,
    doors: offer.vehicle?.doors || 4,
    pickup: `${params.pickupLat},${params.pickupLng}`,
    dropoff: `${params.pickupLat},${params.pickupLng}`,
    total: offer.rates?.[0]?.totalAmount || "0.00",
    currency: offer.rates?.[0]?.currency || params.currency || "USD",
    provider: "amadeus",
    type: "car",
    raw: offer,
  }));

  return results;
}