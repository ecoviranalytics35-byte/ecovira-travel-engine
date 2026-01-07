import { fetchJson } from "@/lib/core/http";
import { getAmadeusToken } from "./amadeus";

/**
 * Book a hotel using Amadeus Hotels Booking API
 * 
 * @param offerId - The hotel offer ID from the search results
 * @param guestInfo - Guest information for the booking
 * @param paymentIntentId - Payment intent ID from Stripe/NOWPayments
 * @returns Booking confirmation details
 */
export async function bookAmadeusHotel(
  offerId: string,
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests?: string;
  },
  paymentIntentId: string
): Promise<{
  bookingId: string;
  confirmationNumber: string;
  status: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  raw: any;
}> {
  const token = await getAmadeusToken();
  
  // Amadeus Hotels Booking API endpoint
  const url = "https://test.api.amadeus.com/v1/booking/hotel-bookings";
  
  // Request body structure for Amadeus Hotels Booking API
  const requestBody = {
    data: {
      offerId: offerId,
      guests: [
        {
          name: {
            title: "MR", // Default title, can be made configurable
            firstName: guestInfo.firstName,
            lastName: guestInfo.lastName,
          },
          contact: {
            phoneNumber: guestInfo.phone,
            email: guestInfo.email,
          },
        },
      ],
      payments: [
        {
          method: "CREDIT_CARD", // Amadeus expects this for card payments
          card: {
            vendorCode: "VI", // Visa, can be made configurable
            cardNumber: "4111111111111111", // Placeholder - in production, use secure tokenization
            expiryDate: "12/25", // Placeholder
            holderName: `${guestInfo.firstName} ${guestInfo.lastName}`,
          },
        },
      ],
      ...(guestInfo.specialRequests && {
        remarks: {
          general: [
            {
              subType: "GENERAL_MISC",
              text: guestInfo.specialRequests,
            },
          ],
        },
      }),
    },
  };

  try {
    const response = await fetchJson<{
      data?: {
        type: string;
        id: string;
        hotel: {
          hotelId: string;
          name: string;
        };
        offers: Array<{
          id: string;
          checkInDate: string;
          checkOutDate: string;
          guests: any[];
        }>;
        guests: any[];
        payments: any[];
        bookingStatus: string;
        associatedRecords: Array<{
          reference: string;
          creationDate: string;
          originSystemCode: string;
        }>;
      };
      warnings?: Array<{ code: string; title: string; detail: string }>;
    }>(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.data) {
      throw new Error("No booking data returned from Amadeus");
    }

    const booking = response.data;
    const confirmationNumber = booking.associatedRecords?.[0]?.reference || booking.id;
    const offer = booking.offers?.[0];

    return {
      bookingId: booking.id,
      confirmationNumber,
      status: booking.bookingStatus || "CONFIRMED",
      hotelName: booking.hotel?.name || "Hotel",
      checkIn: offer?.checkInDate || "",
      checkOut: offer?.checkOutDate || "",
      raw: booking,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[bookAmadeusHotel] Error:", error);
    throw new Error(`Failed to book hotel: ${message}`);
  }
}

/**
 * Get hotel booking details by confirmation number
 */
export async function getAmadeusHotelBooking(
  bookingId: string
): Promise<{
  bookingId: string;
  confirmationNumber: string;
  status: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  raw: any;
}> {
  const token = await getAmadeusToken();
  
  const url = `https://test.api.amadeus.com/v1/booking/hotel-bookings/${bookingId}`;
  
  try {
    const response = await fetchJson<{
      data?: {
        type: string;
        id: string;
        hotel: {
          hotelId: string;
          name: string;
        };
        offers: Array<{
          id: string;
          checkInDate: string;
          checkOutDate: string;
        }>;
        bookingStatus: string;
        associatedRecords: Array<{
          reference: string;
        }>;
      };
    }>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data) {
      throw new Error("Booking not found");
    }

    const booking = response.data;
    const confirmationNumber = booking.associatedRecords?.[0]?.reference || booking.id;
    const offer = booking.offers?.[0];

    return {
      bookingId: booking.id,
      confirmationNumber,
      status: booking.bookingStatus || "CONFIRMED",
      hotelName: booking.hotel?.name || "Hotel",
      checkIn: offer?.checkInDate || "",
      checkOut: offer?.checkOutDate || "",
      raw: booking,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[getAmadeusHotelBooking] Error:", error);
    throw new Error(`Failed to get hotel booking: ${message}`);
  }
}

