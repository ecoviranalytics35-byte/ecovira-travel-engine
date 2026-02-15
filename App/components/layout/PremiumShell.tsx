"use client";

import { ReactNode, useMemo } from 'react';
import { EcoviraTabs } from '../EcoviraTabs';
import { Plane, Hotel, Car, CarTaxiFront } from 'lucide-react';
import { EcoviraChatWidget } from '../chat/EcoviraChatWidget';
import { Footer } from './Footer';
import { useTripContext } from '@/contexts/TripContext';
import { getAirlineName } from '@/lib/trips/airline-checkin-resolver';
import { useUIStore } from '@/stores/uiStore';
import Image from "next/image";

interface PremiumShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  chatContext?: {
    page?: 'flights' | 'stays' | 'cars' | 'transfers';
    route?: { from?: string; to?: string };
    dates?: { depart?: string; return?: string };
    passengers?: number;
    cabin?: string;
    currency?: string;
    topFlights?: Array<{ price: string; duration: string; stops: string; from: string; to: string }>;
  };
}

const tabs = [
  { label: 'Flights', path: '/flights', icon: <Plane size={18} /> },
  { label: 'Stays', path: '/stays', icon: <Hotel size={18} /> },
  { label: 'Cars', path: '/cars', icon: <Car size={18} /> },
  { label: 'Transfers', path: '/transfers', icon: <CarTaxiFront size={18} /> },
];

export function PremiumShell({ children, rightPanel, chatContext: baseChatContext }: PremiumShellProps) {
  const { trip } = useTripContext();
  const chatOpen = useUIStore((s) => s.chatOpen);
  const closeChat = useUIStore((s) => s.closeChat);
  
  // Merge trip context with base chat context
  const chatContext = useMemo(() => {
    if (!trip || !trip.flightData) {
      return baseChatContext;
    }
    
    return {
      ...baseChatContext,
      page: 'my-trips' as const,
      trip: {
        bookingId: trip.id,
        bookingReference: trip.bookingReference,
        airlineIata: trip.flightData.airlineIata,
        airlineName: getAirlineName(trip.flightData.airlineIata),
        flightNumber: trip.flightData.flightNumber,
        scheduledDeparture: trip.flightData.scheduledDeparture,
        departureAirport: trip.flightData.departureAirport,
        arrivalAirport: trip.flightData.arrivalAirport,
      },
    };
  }, [trip, baseChatContext]);

  return (
    <>
      {/* Premium Background - pointer-events: none to prevent blocking clicks */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10] via-[#0F1114] to-[#07080A]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(28,140,130,0.18),transparent_45%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(200,162,77,0.10),transparent_40%)]"></div>
      </div>

      {/* Fixed Header - Guaranteed to stay at top */}
      <header className="fixed top-0 left-0 right-0 z-[9999] w-full border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
              {/* Logo next to title */}
              <Image
                src="/brand/ecovira-logo-transparent.png"
                alt="Ecovira"
                width={240}
                height={96}
                priority
                className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity"
                style={{ width: "auto" }}
              />
              <div 
                className="text-transparent bg-clip-text bg-gradient-to-r from-[#C8A24D] via-[#E3C77A] to-[#C8A24D] font-serif font-bold tracking-tight leading-tight drop-shadow-[0_0_12px_rgba(200,162,77,0.5)]"
                style={{
                  fontSize: 'clamp(1.25rem, 3vw, 2rem)',
                  lineHeight: '1.1',
                  fontWeight: '700'
                }}
              >
                Ecovira Travel Hub
              </div>
            </a>
          </div>
        </div>

        {/* Tabs Bar - Desktop */}
        <div 
          className="hidden md:block relative border-b border-white/10"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <div className="ec-container">
            <div className="flex items-center justify-center py-4">
              <EcoviraTabs tabs={tabs} />
            </div>
          </div>
        </div>

        {/* Tabs Bar - Mobile */}
        <div 
          className="md:hidden relative border-b border-white/10"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <div className="ec-container">
            <div className="flex items-center gap-4 py-3">
              <EcoviraTabs tabs={tabs} className="flex-1" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Add top padding to account for fixed header */}
      <main className="min-h-screen pt-[152px] md:pt-[168px]">
        <div className={`ec-container ec-page ${rightPanel ? 'grid grid-cols-1 lg:grid-cols-12 gap-12' : ''}`}>
          {rightPanel ? (
            <>
              <div className="lg:col-span-8">
                {children}
              </div>
              <div className="lg:col-span-4">
                <div className="sticky top-32">
                  {rightPanel}
                </div>
              </div>
            </>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* 24/7 AI Chat Widget - Controlled by Zustand store */}
      <EcoviraChatWidget context={chatContext} isOpen={chatOpen} onClose={closeChat} />
    </>
  );
}
