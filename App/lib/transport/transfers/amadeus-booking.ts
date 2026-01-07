import { fetchJson } from "@/lib/core/http";
import { getAmadeusToken } from "@/lib/stays/amadeus";
import type { TransferPassengerInfo } from "@/stores/bookingStore";

/**
 * Book a transfer using Amadeus Transfer Booking API
 * 
 * @param offer - The transfer offer from search results
 * @param passengerInfo - Passenger information for the booking
 * @param paymentId - Payment ID from Stripe/NOWPayments
 * @param bookingReference - Our internal booking reference
 * @returns Booking confirmation details
 */
export async function bookAmadeusTransfer(
  offer: any, // The raw Amadeus transfer offer
  passengerInfo: TransferPassengerInfo,
  paymentId: string,
  bookingReference: string,
): Promise<any> {
  const token = await getAmadeusToken();
  
  // Amadeus Transfer Booking API endpoint
  // Note: This endpoint may vary - check Amadeus documentation for exact endpoint
  const url = "https://test.api.amadeus.com/v1/booking/transfer-orders";
  
  // Request body structure for Amadeus Transfer Booking API
  const requestBody = {
    data: {
      type: "transfer-order",
      offerId: offer.id,
      passengers: Array.from({ length: passengerInfo.passengers }, () => ({
        type: "ADULT",
      })),
      luggage: Array.from({ length: passengerInfo.luggage || 0 }, () => ({
        type: "STANDARD",
      })),
      ...(passengerInfo.specialRequests && {
        remarks: {
          general: [
            {
              subType: "GENERAL_MISC",
              text: passengerInfo.specialRequests,
            },
          ],
        },
      }),
      // Payment details - Amadeus may require payment info or may handle it externally
      // For now, we assume payment is handled externally and Amadeus confirms the booking
    },
  };

  console.log("[bookAmadeusTransfer] Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetchJson<any>(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("[bookAmadeusTransfer] Amadeus API Response:", JSON.stringify(response, null, 2));

    if (response.errors) {
      throw new Error(response.errors[0]?.detail || response.errors[0]?.title || "Amadeus transfer booking failed");
    }

    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[bookAmadeusTransfer] Error:", error);
    throw new Error(`Failed to book transfer: ${message}`);
  }
}

/**
 * Get transfer booking details by booking ID
 */
export async function getAmadeusTransferBooking(bookingId: string): Promise<any> {
  const token = await getAmadeusToken();
  
  const url = `https://test.api.amadeus.com/v1/booking/transfer-orders/${bookingId}`;
  
  try {
    const response = await fetchJson<any>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.errors) {
      throw new Error(response.errors[0]?.detail || response.errors[0]?.title || "Failed to retrieve Amadeus transfer booking");
    }

    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[getAmadeusTransferBooking] Error:", error);
    throw new Error(`Failed to get transfer booking: ${message}`);
  }
}

