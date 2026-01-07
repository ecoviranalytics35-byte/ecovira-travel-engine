import { fetchJson } from "@/lib/core/http";
import { getAmadeusToken } from "@/lib/stays/amadeus";
import type { CarDriverInfo } from "@/stores/bookingStore";

/**
 * Book a car rental using Amadeus Car Rental Booking API
 * 
 * @param offer - The car rental offer from search results
 * @param driverInfo - Driver information for the booking
 * @param paymentId - Payment ID from Stripe/NOWPayments
 * @param bookingReference - Our internal booking reference
 * @returns Booking confirmation details
 */
export async function bookAmadeusCar(
  offer: any, // The raw Amadeus car offer
  driverInfo: CarDriverInfo,
  paymentId: string,
  bookingReference: string,
): Promise<any> {
  const token = await getAmadeusToken();
  
  // Amadeus Car Rental Booking API endpoint
  // Note: This endpoint may vary - check Amadeus documentation for exact endpoint
  const url = "https://test.api.amadeus.com/v1/booking/car-rental-bookings";
  
  // Request body structure for Amadeus Car Rental Booking API
  const requestBody = {
    data: {
      type: "car-rental-booking",
      offerId: offer.id,
      driver: {
        name: {
          firstName: driverInfo.firstName,
          lastName: driverInfo.lastName,
        },
        contact: {
          email: driverInfo.email,
          phone: driverInfo.phone,
        },
        ...(driverInfo.licenseNumber && {
          license: {
            number: driverInfo.licenseNumber,
            country: driverInfo.licenseCountry || "AU",
          },
        }),
        age: driverInfo.age || 30,
      },
      // Payment details - Amadeus may require payment info or may handle it externally
      // For now, we assume payment is handled externally and Amadeus confirms the booking
      // This is a simplified model, real Amadeus booking might require more details
    },
  };

  console.log("[bookAmadeusCar] Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetchJson<any>(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("[bookAmadeusCar] Amadeus API Response:", JSON.stringify(response, null, 2));

    if (response.errors) {
      throw new Error(response.errors[0]?.detail || response.errors[0]?.title || "Amadeus car booking failed");
    }

    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[bookAmadeusCar] Error:", error);
    throw new Error(`Failed to book car rental: ${message}`);
  }
}

/**
 * Get car rental booking details by booking ID
 */
export async function getAmadeusCarBooking(bookingId: string): Promise<any> {
  const token = await getAmadeusToken();
  
  const url = `https://test.api.amadeus.com/v1/booking/car-rental-bookings/${bookingId}`;
  
  try {
    const response = await fetchJson<any>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.errors) {
      throw new Error(response.errors[0]?.detail || response.errors[0]?.title || "Failed to retrieve Amadeus car booking");
    }

    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[getAmadeusCarBooking] Error:", error);
    throw new Error(`Failed to get car booking: ${message}`);
  }
}

