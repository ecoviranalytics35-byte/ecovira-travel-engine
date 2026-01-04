import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FlightResult } from "@/lib/core/types";

export interface Passenger {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  gender: "male" | "female" | "other";
  nationality: string;
  passportNo?: string;
  passportExpiry?: string;
  email: string;
  phone: string;
  confirmed: boolean;
}

export interface BaggageSelection {
  carryOn: boolean;
  checkedBags: Array<{
    type: "20kg" | "25kg" | "30kg" | "35kg";
    quantity: number;
    price: number;
  }>;
}

export interface SeatSelection {
  passengerId: string;
  seatNumber: string;
  price: number;
}

export interface InsuranceSelection {
  plan: "basic" | "premium" | "none";
  price: number;
  provider?: string;
}

export interface BookingPricing {
  base: number;
  taxes: number;
  addOns: number;
  discounts: number;
  total: number;
  currency: string;
}

export interface PaymentInfo {
  method: "stripe" | "crypto" | null;
  status: "pending" | "processing" | "succeeded" | "failed";
  paymentId?: string;
  intentId?: string;
}

export interface BookingInfo {
  provider: string;
  pnr?: string;
  reference?: string;
  ticketUrl?: string;
  ticketPdf?: string;
  bookingId?: string;
}

export interface BookingState {
  // Flight selection
  selectedOffer: FlightResult | null;
  
  // Step data
  passengers: Passenger[];
  baggage: BaggageSelection;
  seats: SeatSelection[];
  insurance: InsuranceSelection | null;
  
  // Pricing
  currency: string;
  pricing: BookingPricing;
  
  // Payment
  payment: PaymentInfo;
  
  // Booking result
  booking: BookingInfo | null;
  
  // Step completion flags
  stepCompletion: {
    passengers: boolean;
    baggage: boolean;
    seats: boolean;
    insurance: boolean;
    checkout: boolean;
  };
  
  // Actions
  setSelectedOffer: (offer: FlightResult) => void;
  addPassenger: (passenger: Passenger) => void;
  updatePassenger: (id: string, passenger: Partial<Passenger>) => void;
  removePassenger: (id: string) => void;
  setBaggage: (baggage: BaggageSelection) => void;
  addSeat: (seat: SeatSelection) => void;
  removeSeat: (passengerId: string) => void;
  setInsurance: (insurance: InsuranceSelection | null) => void;
  setCurrency: (currency: string) => void;
  updatePricing: (pricing: Partial<BookingPricing>) => void;
  setPayment: (payment: Partial<PaymentInfo>) => void;
  setBooking: (booking: BookingInfo) => void;
  completeStep: (step: keyof BookingState["stepCompletion"]) => void;
  clearBooking: () => void;
}

const defaultBaggage: BaggageSelection = {
  carryOn: true,
  checkedBags: [],
};

const defaultPricing: BookingPricing = {
  base: 0,
  taxes: 0,
  addOns: 0,
  discounts: 0,
  total: 0,
  currency: "AUD",
};

const defaultStepCompletion = {
  passengers: false,
  baggage: false,
  seats: false,
  insurance: false,
  checkout: false,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      selectedOffer: null,
      passengers: [],
      baggage: defaultBaggage,
      seats: [],
      insurance: null,
      currency: "AUD",
      pricing: defaultPricing,
      payment: {
        method: null,
        status: "pending",
      },
      booking: null,
      stepCompletion: defaultStepCompletion,

      setSelectedOffer: (offer) => {
        set({ selectedOffer: offer });
        // Recalculate pricing when offer changes
        const base = typeof offer.price === "string" 
          ? parseFloat(offer.price.replace(/[^0-9.]/g, "")) 
          : typeof offer.price === "number" 
          ? offer.price 
          : 0;
        set({
          pricing: {
            ...defaultPricing,
            base,
            currency: offer.currency || "AUD",
            total: base,
          },
          currency: offer.currency || "AUD",
        });
      },

      addPassenger: (passenger) => {
        set((state) => ({
          passengers: [...state.passengers, passenger],
        }));
      },

      updatePassenger: (id, updates) => {
        set((state) => ({
          passengers: state.passengers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      removePassenger: (id) => {
        set((state) => ({
          passengers: state.passengers.filter((p) => p.id !== id),
          seats: state.seats.filter((s) => s.passengerId !== id),
        }));
      },

      setBaggage: (baggage) => {
        set({ baggage });
        // Recalculate add-ons
        const addOnsTotal = baggage.checkedBags.reduce(
          (sum, bag) => sum + bag.price * bag.quantity,
          0
        );
        set((state) => ({
          pricing: {
            ...state.pricing,
            addOns: addOnsTotal,
            total: state.pricing.base + state.pricing.taxes + addOnsTotal - state.pricing.discounts,
          },
        }));
      },

      addSeat: (seat) => {
        set((state) => {
          const existingIndex = state.seats.findIndex(
            (s) => s.passengerId === seat.passengerId
          );
          const newSeats =
            existingIndex >= 0
              ? state.seats.map((s, i) => (i === existingIndex ? seat : s))
              : [...state.seats, seat];
          
          const seatsTotal = newSeats.reduce((sum, s) => sum + s.price, 0);
          return {
            seats: newSeats,
            pricing: {
              ...state.pricing,
              addOns: state.pricing.addOns + (seat.price - (state.seats[existingIndex]?.price || 0)),
              total: state.pricing.base + state.pricing.taxes + state.pricing.addOns + seatsTotal - state.pricing.discounts,
            },
          };
        });
      },

      removeSeat: (passengerId) => {
        set((state) => {
          const seat = state.seats.find((s) => s.passengerId === passengerId);
          const newSeats = state.seats.filter((s) => s.passengerId !== passengerId);
          return {
            seats: newSeats,
            pricing: {
              ...state.pricing,
              addOns: state.pricing.addOns - (seat?.price || 0),
              total: state.pricing.base + state.pricing.taxes + state.pricing.addOns - (seat?.price || 0) - state.pricing.discounts,
            },
          };
        });
      },

      setInsurance: (insurance) => {
        set({ insurance });
        const insurancePrice = insurance?.price || 0;
        set((state) => ({
          pricing: {
            ...state.pricing,
            addOns: state.pricing.addOns + insurancePrice - (state.insurance?.price || 0),
            total: state.pricing.base + state.pricing.taxes + state.pricing.addOns + insurancePrice - (state.insurance?.price || 0) - state.pricing.discounts,
          },
        }));
      },

      setCurrency: (currency) => {
        set({ currency });
      },

      updatePricing: (updates) => {
        set((state) => ({
          pricing: { ...state.pricing, ...updates },
        }));
      },

      setPayment: (updates) => {
        set((state) => ({
          payment: { ...state.payment, ...updates },
        }));
      },

      setBooking: (booking) => {
        set({ booking });
      },

      completeStep: (step) => {
        set((state) => ({
          stepCompletion: { ...state.stepCompletion, [step]: true },
        }));
      },

      clearBooking: () => {
        set({
          selectedOffer: null,
          passengers: [],
          baggage: defaultBaggage,
          seats: [],
          insurance: null,
          currency: "AUD",
          pricing: defaultPricing,
          payment: {
            method: null,
            status: "pending",
          },
          booking: null,
          stepCompletion: defaultStepCompletion,
        });
      },
    }),
    {
      name: "ecoviraBookingState",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

