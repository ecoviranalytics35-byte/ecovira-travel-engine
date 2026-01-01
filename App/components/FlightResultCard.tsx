"use client";

import { FlightResult } from '@/lib/core/types';
import { EcoviraCard } from './EcoviraCard';
import { track } from '@/lib/analytics/track';

interface FlightResultCardProps {
  flight: FlightResult;
  onSelect?: (flight: FlightResult) => void;
}

export function FlightResultCard({ flight, onSelect }: FlightResultCardProps) {
  // Ensure offer has a valid ID
  const offerId = flight.id || `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const hasValidId = !!flight.id;
  
  // Log error if ID is missing
  if (!flight.id) {
    console.error("[FlightResultCard] MISSING OFFER ID", { flight, offerId });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FlightResultCard.tsx:15',message:'[FlightResultCard] MISSING OFFER ID',data:{flight,offerId},timestamp:Date.now(),sessionId:'debug-session',runId:'select-fix',hypothesisId:'D'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
    // #endregion
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
              e.preventDefault();
              e.stopPropagation();
              
              // STEP 1: PROVE CLICK FIRES (MANDATORY)
              console.log("[SELECT_FLIGHT_CLICK]", offerId);
              alert("clicked");
              
              // If we get here, click works - proceed with logic
              if (!onSelect) {
                console.error("[SELECT_FLIGHT] ERROR - onSelect handler missing", { offerId, flight });
                return;
              }
              
              if (!hasValidId) {
                console.error("[SELECT_FLIGHT] ERROR - Missing offer ID", { offerId, flight });
                return;
              }
              
              // REQUIRED: Instrumentation log
              console.log("[select_flight]", offerId, flight);
              
              // REQUIRED: Analytics tracking
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
              
              console.log("[SelectFlight] BUTTON CLICKED", { 
                offerId, 
                hasValidId, 
                hasOnSelect: !!onSelect,
                flight: { id: flight.id, from: flight.from, to: flight.to, price: flight.price }
              });
              
              if (!onSelect) {
                console.error("[SelectFlight] ERROR - onSelect handler missing", { offerId, flight });
                track({
                  event: 'select_flight_error',
                  category: 'flights',
                  error: 'handler_missing',
                  offerId: offerId,
                });
                alert("Selection handler not available. Please refresh the page.");
                return;
              }
              
              if (!hasValidId) {
                console.error("[SelectFlight] ERROR - Missing offer ID", { offerId, flight });
                track({
                  event: 'select_flight_error',
                  category: 'flights',
                  error: 'missing_offer_id',
                  offerId: offerId,
                });
                alert("Cannot select flight: missing offer ID. Please try another option.");
                return;
              }
              
              // REQUIRED: Persist flight data BEFORE navigation
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
                console.log("[SelectFlight] Flight data persisted to sessionStorage", flightData);
              } catch (err) {
                console.warn("[SelectFlight] Failed to persist to sessionStorage", err);
                track({
                  event: 'select_flight_error',
                  category: 'flights',
                  error: 'storage_failed',
                  offerId: offerId,
                });
              }
              
              const normalizedFlight = { ...flight, id: offerId };
              console.log("[SelectFlight] Calling onSelect handler", { offerId, normalizedFlight });
              
              try {
                // Call handler - this should trigger navigation
                onSelect(normalizedFlight);
                console.log("[SelectFlight] onSelect handler called successfully");
              } catch (err) {
                console.error("[SelectFlight] ERROR calling onSelect", err);
                track({
                  event: 'select_flight_error',
                  category: 'flights',
                  error: 'handler_error',
                  offerId: offerId,
                  errorMessage: err instanceof Error ? err.message : 'Unknown error',
                });
                alert(`Failed to select flight: ${err instanceof Error ? err.message : 'Unknown error'}`);
              }
            }}
            disabled={!hasValidId || !onSelect}
            style={{ 
              position: 'relative',
              zIndex: 1000,
              pointerEvents: 'auto',
              cursor: (!hasValidId || !onSelect) ? 'not-allowed' : 'pointer',
            }}
            className="px-6 py-3 min-w-[180px] rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold text-sm shadow-[0_0_8px_rgba(28,140,130,0.3),0_0_16px_rgba(28,140,130,0.2)] hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.7)] hover:from-[rgba(28,140,130,0.5)] hover:to-[rgba(28,140,130,0.4)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!hasValidId ? "Missing offer ID - cannot select this flight" : !onSelect ? "Selection handler not available" : "Select this flight"}
          >
            Select Flight →
          </button>
        </div>
      </div>
    </EcoviraCard>
  );
}