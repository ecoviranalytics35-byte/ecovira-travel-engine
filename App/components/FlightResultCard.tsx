"use client";

import { useRef } from 'react';
import { FlightResult } from '@/lib/core/types';
import { EcoviraCard } from './EcoviraCard';
import { track } from '@/lib/analytics/track';

interface FlightResultCardProps {
  flight: FlightResult;
  onSelect?: (flight: FlightResult) => void;
}

// Global dedupe guard - shared across all component instances
// Prevents multiple fires even if component remounts or React Strict Mode double-invokes
const globalClickGuard = new Map<string, number>();

export function FlightResultCard({ flight, onSelect }: FlightResultCardProps) {
  // Per-component click guard (backup to global guard)
  const lastClickRef = useRef(0);
  
  // Ensure offer has a valid ID - use fallback if missing
  const offerId = flight.id || `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // Allow fallback IDs - don't disable button if fallback is used
  const hasValidId = !!offerId;
  
  // Log warning if using fallback ID (but don't block selection)
  if (!flight.id) {
    console.warn("[FlightResultCard] Using fallback ID", { flight, offerId });
  }

  // Mock additional data for display
  const airline = flight.provider || 'Amadeus';
  const airlineInitial = airline.charAt(0).toUpperCase();
  const duration = '4 Hours 5 Minutes';
  const stops = '1 Stop';
  const departureDate = 'Dec 05, 2025 14:40';
  const arrivalDate = 'Dec 05, 2025 16:15';

  return (
    <EcoviraCard variant="glass" className="p-6 relative" style={{ position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>
      <div className="max-w-[1100px] mx-auto" style={{ pointerEvents: 'auto', position: 'relative' }}>
        {/* Top Row: Airline + Price */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-ec-teal flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">{airlineInitial}</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-ec-text">{airline}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl md:text-4xl font-bold text-ec-text">
              {flight.currency} {flight.price}
            </div>
            <div className="text-sm text-ec-muted mt-1">per person</div>
          </div>
        </div>

        {/* Middle: Route + Times */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-[rgba(28,140,130,0.15)]">
          <div>
            <div className="inline-block px-3 py-1.5 mb-3 bg-gradient-to-br from-[rgba(28,140,130,0.25)] to-[rgba(28,140,130,0.15)] border border-[rgba(28,140,130,0.4)] rounded-full text-xs font-semibold uppercase tracking-[0.12em] text-ec-text shadow-[0_0_8px_rgba(28,140,130,0.3)]">
              Departure
            </div>
            <div className="text-lg font-bold text-ec-text mb-1">{departureDate}</div>
            <div className="text-sm text-ec-muted">{flight.from}</div>
          </div>
          <div className="text-center">
            <div className="inline-block px-3 py-1.5 mb-3 bg-gradient-to-br from-[rgba(28,140,130,0.25)] to-[rgba(28,140,130,0.15)] border border-[rgba(28,140,130,0.4)] rounded-full text-xs font-semibold uppercase tracking-[0.12em] text-ec-text shadow-[0_0_8px_rgba(28,140,130,0.3)]">
              Duration
            </div>
            <div className="text-lg font-bold text-ec-teal mb-1">{duration}</div>
            <div className="text-sm text-ec-muted">{stops}</div>
          </div>
          <div>
            <div className="inline-block px-3 py-1.5 mb-3 bg-gradient-to-br from-[rgba(28,140,130,0.25)] to-[rgba(28,140,130,0.15)] border border-[rgba(28,140,130,0.4)] rounded-full text-xs font-semibold uppercase tracking-[0.12em] text-ec-text shadow-[0_0_8px_rgba(28,140,130,0.3)]">
              Arrival
            </div>
            <div className="text-lg font-bold text-ec-text mb-1">{arrivalDate}</div>
            <div className="text-sm text-ec-muted">{flight.to}</div>
          </div>
        </div>

        {/* Bottom: CTA */}
        <div className="flex items-center justify-end gap-4" style={{ position: 'relative', zIndex: 10 }}>
          <button
            type="button"
            onClick={(e) => {
              // CRITICAL: Stop all event propagation immediately
              e.preventDefault();
              e.stopPropagation();
              
              // Dual dedupe guards: per-component ref + global map
              const now = Date.now();
              
              // Per-component guard (500ms)
              if (now - lastClickRef.current < 500) {
                console.log("[SelectFlight] Component dedupe guard blocked duplicate click", { offerId });
                return;
              }
              lastClickRef.current = now;
              
              // Global dedupe guard: prevent multiple fires within 500ms per offerId
              const lastClick = globalClickGuard.get(offerId) || 0;
              if (now - lastClick < 500) {
                console.log("[SelectFlight] Global dedupe guard blocked duplicate click", { offerId, timeSinceLastClick: now - lastClick });
                return;
              }
              globalClickGuard.set(offerId, now);
              
              // Validate handler
              if (!onSelect) {
                console.error("[SelectFlight] ERROR - onSelect handler missing", { offerId });
                globalClickGuard.delete(offerId); // Reset guard on error
                return;
              }
              
              // Validate ID (allow fallback IDs)
              if (!hasValidId || !offerId) {
                console.error("[SelectFlight] ERROR - Invalid offer ID", { offerId, flight });
                globalClickGuard.delete(offerId); // Reset guard on error
                return;
              }
              
              // Analytics tracking - only once per click (guaranteed by dedupe guard)
              track({
                event: 'select_flight',
                category: 'flights',
                provider: flight.provider || 'unknown',
                offerId: offerId,
                flightId: offerId,
                from: flight.from,
                to: flight.to,
                price: flight.price,
                currency: flight.currency,
              });
              
              // Persist flight data to sessionStorage (backup)
              const flightData = {
                id: offerId,
                from: flight.from,
                to: flight.to,
                departDate: flight.departDate,
                price: flight.price,
                currency: flight.currency,
                provider: flight.provider,
                raw: flight.raw,
              };
              
              try {
                sessionStorage.setItem('selectedFlight', JSON.stringify(flightData));
              } catch (err) {
                console.warn("[SelectFlight] Failed to persist to sessionStorage", err);
              }
              
              // Call handler - this will trigger navigation
              const normalizedFlight = { ...flight, id: offerId };
              try {
                console.log("[SelectFlight] Calling onSelect handler", { 
                  offerId, 
                  hasOnSelect: !!onSelect,
                  onSelectType: typeof onSelect,
                  onSelectName: onSelect?.name,
                  flightId: normalizedFlight.id 
                });
                
                if (!onSelect) {
                  console.error("[SelectFlight] FATAL: onSelect is null/undefined!");
                  // Fallback: navigate directly
                  if (typeof window !== 'undefined') {
                    window.location.href = '/book/passengers';
                  }
                  return;
                }
                
                // Call the handler
                onSelect(normalizedFlight);
                console.log("[SelectFlight] onSelect handler completed");
                
                // Verify navigation after delay - if not navigated, use fallback
                setTimeout(() => {
                  if (typeof window !== 'undefined') {
                    const currentUrl = window.location.href;
                    console.log("[SelectFlight] Post-navigation check - URL:", currentUrl);
                    if (!currentUrl.includes('/book/passengers')) {
                      console.warn("[SelectFlight] Navigation failed, using direct fallback");
                      // Save to sessionStorage as backup
                      try {
                        sessionStorage.setItem('selectedFlight', JSON.stringify(normalizedFlight));
                      } catch (e) {
                        console.warn("[SelectFlight] Failed to save to sessionStorage", e);
                      }
                      window.location.href = '/book/passengers';
                    }
                  }
                }, 300);
              } catch (err) {
                console.error("[SelectFlight] ERROR calling onSelect", err);
                globalClickGuard.delete(offerId); // Reset guard on error
                track({
                  event: 'select_flight_error',
                  category: 'flights',
                  error: 'handler_error',
                  offerId: offerId,
                  errorMessage: err instanceof Error ? err.message : 'Unknown error',
                });
                // Fallback navigation on error
                if (typeof window !== 'undefined') {
                  window.location.href = '/book/passengers';
                }
              }
            }}
            disabled={!onSelect}
            style={{ 
              position: 'relative',
              zIndex: 1000,
              pointerEvents: 'auto',
              cursor: (!hasValidId || !onSelect) ? 'not-allowed' : 'pointer',
            }}
            className="px-6 py-3 min-w-[180px] rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold text-sm shadow-[0_0_8px_rgba(28,140,130,0.3),0_0_16px_rgba(28,140,130,0.2)] hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.7)] hover:from-[rgba(28,140,130,0.5)] hover:to-[rgba(28,140,130,0.4)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!onSelect ? "Selection handler not available" : "Select this flight"}
          >
            Select Flight →
          </button>
        </div>
      </div>
    </EcoviraCard>
  );
}