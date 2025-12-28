export async function searchDuffelFlights(params: { from: string; to: string; departDate: string; adults: number; cabinClass?: string; tripType?: string; returnDate?: string; children?: number; infants?: number }) {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Duffel key missing");
  }

  const url = "https://api.duffel.com/air/offer_requests?return_offers=true";
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Duffel-Version": "v2",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip"
  };

  const slices = [
    {
      origin: params.from,
      destination: params.to,
      departure_date: params.departDate
    }
  ];

  if (params.tripType === "return" && params.returnDate) {
    slices.push({
      origin: params.to,
      destination: params.from,
      departure_date: params.returnDate
    });
  }

  const passengers = [];
  for (let i = 0; i < (params.adults || 1); i++) {
    passengers.push({ type: "adult" });
  }
  for (let i = 0; i < (params.children || 0); i++) {
    passengers.push({ type: "child" });
  }
  for (let i = 0; i < (params.infants || 0); i++) {
    passengers.push({ type: "infant_without_seat" });
  }

  const body = {
    data: {
      slices,
      passengers,
      cabin_class: params.cabinClass || "economy"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errorMsg = `Duffel API error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.errors && errorData.errors[0]) {
        errorMsg += `: ${errorData.errors[0].title || errorData.errors[0].message}`;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const offers = data.data.offers || [];
  const offerRequestId = data.data.id;
  const offersCount = offers.length;
  const rawKeys = Object.keys(data.data || {});
  const results = offers.slice(0, 10).map((offer: any) => ({
    id: offer.id,
    from: params.from,
    to: params.to,
    departDate: params.departDate,
    price: offer.total_amount,
    currency: offer.total_currency,
    provider: "duffel",
    raw: offer
  }));
  return { results, debug: { offerRequestId, offersCount, rawKeys } };
}