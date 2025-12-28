import { fetchJson } from "@/lib/core/http";

export async function getAmadeusToken(): Promise<string> {
  const key = process.env.AMADEUS_API_KEY;
  const secret = process.env.AMADEUS_API_SECRET;
  if (!key || !secret) {
    throw new Error("Amadeus keys missing");
  }

  const url = "https://test.api.amadeus.com/v1/security/oauth2/token";
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: key,
    client_secret: secret,
  });

  const data = await fetchJson<{ access_token: string }>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  return data.access_token;
}

export async function hotelsByCity(cityCode: string, token: string): Promise<string[]> {
  const url = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`;
  const data = await fetchJson<{ data: { hotelId: string }[] }>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.data.map(h => h.hotelId);
}

export async function hotelOffers(hotelIds: string[], token: string, adults: number, checkInDate: string, nights: number, roomQuantity: number): Promise<any[]> {
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + nights);
  const checkOutStr = checkOutDate.toISOString().split('T')[0];

  const ids = hotelIds.slice(0, 10).join(","); // Limit to 10 hotels
  const url = `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${ids}&adults=${adults}&checkInDate=${checkInDate}&checkOutDate=${checkOutStr}&roomQuantity=${roomQuantity}`;

  const data = await fetchJson<{ data: any[] }>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Normalize results
  const results: any[] = [];
  for (const hotel of data.data) {
    const hotelInfo = hotel.hotel;
    for (const offer of hotel.offers) {
      results.push({
        id: offer.id,
        cityCode: hotelInfo.cityCode,
        name: hotelInfo.name,
        nights: nights,
        total: offer.price.total,
        currency: offer.price.currency,
        provider: "amadeus",
      });
    }
  }

  return results.slice(0, 10); // Limit to 10 offers
}