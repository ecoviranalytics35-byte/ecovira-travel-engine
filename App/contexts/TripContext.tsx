"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import type { TripBooking } from '@/lib/core/trip-types';

interface TripContextValue {
  trip: TripBooking | null;
  setTrip: (trip: TripBooking | null) => void;
}

const TripContext = createContext<TripContextValue | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const [trip, setTrip] = useState<TripBooking | null>(null);

  return (
    <TripContext.Provider value={{ trip, setTrip }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTripContext() {
  const context = useContext(TripContext);
  if (context === undefined) {
    // Return a safe default if used outside provider (shouldn't happen, but graceful fallback)
    return { trip: null, setTrip: () => {} };
  }
  return context;
}

