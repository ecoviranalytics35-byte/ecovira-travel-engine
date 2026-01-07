import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FlightResult, StayResult, CarResult, TransferResult } from "@/lib/core/types";

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

// Multi-product booking items
export interface BookingItems {
  flights?: FlightResult[];
  stays?: StayResult[];
  cars?: CarResult[];
  transfers?: TransferResult[];
}

// Product-specific configuration
export interface StayGuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests?: string;
}

export interface CarDriverInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  licenseCountry?: string;
  age?: number;
}

export interface TransferPassengerInfo {
  passengers: number;
  luggage: number;
  specialRequests?: string;
}

export interface BookingState {
  // Multi-product selection (replaces selectedOffer for backward compatibility)
  items: BookingItems;
  
  // Legacy: Product selection (maintained for backward compatibility)
  selectedOffer: FlightResult | StayResult | CarResult | TransferResult | null;
  
  // Flight-specific step data
  passengers: Passenger[];
  baggage: BaggageSelection;
  seats: SeatSelection[];
  insurance: InsuranceSelection | null;
  
  // Product-specific guest/driver info
  stayGuestInfo?: StayGuestInfo;
  carDriverInfo?: CarDriverInfo;
  transferPassengerInfo?: TransferPassengerInfo;
  
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
    // Product-specific steps
    stayGuestInfo?: boolean;
    carDriverInfo?: boolean;
    transferPassengerInfo?: boolean;
  };
  
  // Actions - Multi-product
  addItem: (type: 'flight' | 'stay' | 'car' | 'transfer', item: FlightResult | StayResult | CarResult | TransferResult) => void;
  removeItem: (type: 'flight' | 'stay' | 'car' | 'transfer', itemId: string) => void;
  clearItems: (type?: 'flight' | 'stay' | 'car' | 'transfer') => void;
  
  // Actions - Legacy (maintained for backward compatibility)
  setSelectedOffer: (offer: FlightResult | StayResult | CarResult | TransferResult) => void;
  
  // Actions - Flight-specific
  addPassenger: (passenger: Passenger) => void;
  updatePassenger: (id: string, passenger: Partial<Passenger>) => void;
  removePassenger: (id: string) => void;
  setBaggage: (baggage: BaggageSelection) => void;
  addSeat: (seat: SeatSelection) => void;
  removeSeat: (passengerId: string) => void;
  setInsurance: (insurance: InsuranceSelection | null) => void;
  
  // Actions - Product-specific
  setStayGuestInfo: (info: StayGuestInfo) => void;
  setCarDriverInfo: (info: CarDriverInfo) => void;
  setTransferPassengerInfo: (info: TransferPassengerInfo) => void;
  
  // Actions - Common
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
  stayGuestInfo: false,
  carDriverInfo: false,
  transferPassengerInfo: false,
};

// Helper function to calculate total from all items
function calculateTotalFromItems(items: BookingItems): number {
  let total = 0;
  
  if (items.flights) {
    total += items.flights.reduce((sum, f) => {
      const price = typeof f.price === "string" 
        ? parseFloat(f.price.replace(/[^0-9.]/g, "")) 
        : typeof f.price === "number" 
        ? f.price 
        : 0;
      return sum + price;
    }, 0);
  }
  
  if (items.stays) {
    total += items.stays.reduce((sum, s) => {
      const price = typeof s.total === "string" 
        ? parseFloat(s.total.replace(/[^0-9.]/g, "")) 
        : typeof s.total === "number" 
        ? s.total 
        : 0;
      return sum + price;
    }, 0);
  }
  
  if (items.cars) {
    total += items.cars.reduce((sum, c) => {
      const price = typeof c.total === "string" 
        ? parseFloat(c.total.replace(/[^0-9.]/g, "")) 
        : typeof c.total === "number" 
        ? c.total 
        : 0;
      return sum + price;
    }, 0);
  }
  
  if (items.transfers) {
    total += items.transfers.reduce((sum, t) => {
      const price = typeof t.total === "string" 
        ? parseFloat(t.total.replace(/[^0-9.]/g, "")) 
        : typeof t.total === "number" 
        ? t.total 
        : 0;
      return sum + price;
    }, 0);
  }
  
  return total;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      // Multi-product items
      items: {},
      
      // Legacy: Flight selection (maintained for backward compatibility)
      selectedOffer: null,
      
      // Flight-specific
      passengers: [],
      baggage: defaultBaggage,
      seats: [],
      insurance: null,
      
      // Product-specific info
      stayGuestInfo: undefined,
      carDriverInfo: undefined,
      transferPassengerInfo: undefined,
      
      // Common
      currency: "AUD",
      pricing: defaultPricing,
      payment: {
        method: null,
        status: "pending",
      },
      booking: null,
      stepCompletion: defaultStepCompletion,

      // Multi-product actions
      addItem: (type, item) => {
        set((state) => {
          const items = { ...state.items };
          const key = `${type}s` as keyof BookingItems;
          
          if (!items[key]) {
            items[key] = [];
          }
          
          // Check if item already exists (by id)
          const existing = (items[key] as any[]).findIndex((i: any) => i.id === item.id);
          if (existing >= 0) {
            // Update existing
            (items[key] as any[])[existing] = item;
          } else {
            // Add new
            (items[key] as any[]).push(item);
          }
          
          // Recalculate pricing
          const total = calculateTotalFromItems(items);
          const currency = item.currency || state.currency || "AUD";
          
          return {
            items,
            pricing: {
              ...state.pricing,
              base: total,
              total,
              currency,
            },
            currency: state.currency || currency,
            // Legacy: If it's a flight, also set selectedOffer for backward compatibility
            ...(type === 'flight' && { selectedOffer: item as FlightResult }),
          };
        });
      },

      removeItem: (type, itemId) => {
        set((state) => {
          const items = { ...state.items };
          const key = `${type}s` as keyof BookingItems;
          
          if (items[key]) {
            (items[key] as any[]) = (items[key] as any[]).filter((i: any) => i.id !== itemId);
            if ((items[key] as any[]).length === 0) {
              delete items[key];
            }
          }
          
          // Recalculate pricing
          const total = calculateTotalFromItems(items);
          
          return {
            items,
            pricing: {
              ...state.pricing,
              base: total,
              total,
            },
            // Legacy: If removing flight and it was selectedOffer, clear it
            ...(type === 'flight' && state.selectedOffer?.id === itemId && { selectedOffer: null }),
          };
        });
      },

      clearItems: (type) => {
        set((state) => {
          if (type) {
            // Clear specific type
            const items = { ...state.items };
            const key = `${type}s` as keyof BookingItems;
            delete items[key];
            
            const total = calculateTotalFromItems(items);
            return {
              items,
              pricing: {
                ...state.pricing,
                base: total,
                total,
              },
              // Legacy: If clearing flights, also clear selectedOffer
              ...(type === 'flight' && { selectedOffer: null }),
            };
          } else {
            // Clear all
            return {
              items: {},
              selectedOffer: null,
              pricing: defaultPricing,
            };
          }
        });
      },

      // Legacy: Maintained for backward compatibility
      setSelectedOffer: (offer) => {
        // Use addItem internally to maintain consistency
        const type = offer.type || 'flight';
        get().addItem(type as 'flight' | 'stay' | 'car' | 'transfer', offer);
        // Also set selectedOffer for backward compatibility
        set({ selectedOffer: offer });
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
        // Persist to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("ecovira_currency", currency);
        }
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

      // Product-specific actions
      setStayGuestInfo: (info) => {
        set({ stayGuestInfo: info, stepCompletion: { ...get().stepCompletion, stayGuestInfo: true } });
      },

      setCarDriverInfo: (info) => {
        set({ carDriverInfo: info, stepCompletion: { ...get().stepCompletion, carDriverInfo: true } });
      },

      setTransferPassengerInfo: (info) => {
        set({ transferPassengerInfo: info, stepCompletion: { ...get().stepCompletion, transferPassengerInfo: true } });
      },

      clearBooking: () => {
        set({
          items: {},
          selectedOffer: null,
          passengers: [],
          baggage: defaultBaggage,
          seats: [],
          insurance: null,
          stayGuestInfo: undefined,
          carDriverInfo: undefined,
          transferPassengerInfo: undefined,
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

