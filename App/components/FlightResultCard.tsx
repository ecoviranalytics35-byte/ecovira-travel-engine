"use client";

import { FlightResult } from '@/lib/core/types';
import { EcoviraCard } from './EcoviraCard';

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
    <EcoviraCard variant="glass" className="p-6 relative">
      <div className="max-w-[1100px] mx-auto pointer-events-auto">
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
        <div className="flex items-center justify-end gap-4 pointer-events-auto">
          <button
            type="button"
            disabled={!hasValidId}
            className="relative z-[9999] pointer-events-auto cursor-pointer px-6 py-3 min-w-[180px] rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold text-sm shadow-[0_0_8px_rgba(28,140,130,0.3),0_0_16px_rgba(28,140,130,0.2)] hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.7)] hover:from-[rgba(28,140,130,0.5)] hover:to-[rgba(28,140,130,0.4)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!hasValidId ? "Missing offer ID - cannot select this flight" : undefined}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("[SelectFlight] POINTERDOWN fired", offerId);
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FlightResultCard.tsx:83',message:'[SelectFlight] POINTERDOWN fired',data:{offerId},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
              // #endregion
              
              if (!hasValidId) {
                console.error("[SelectFlight] BLOCKED - Missing offer ID", { offerId, flight });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FlightResultCard.tsx:90',message:'[SelectFlight] BLOCKED - Missing offer ID',data:{offerId,flight},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'D'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
                // #endregion
                return;
              }
              
              if (onSelect) {
                const normalizedFlight = { ...flight, id: offerId };
                console.log("[SelectFlight] Calling onSelect with normalized flight", { offerId, normalizedFlight });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FlightResultCard.tsx:101',message:'[SelectFlight] Calling onSelect with normalized flight',data:{offerId,normalizedFlight},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
                // #endregion
                onSelect(normalizedFlight);
              } else {
                console.warn("[SelectFlight] onSelect handler missing", { offerId });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FlightResultCard.tsx:108',message:'[SelectFlight] onSelect handler missing',data:{offerId},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'B'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
                // #endregion
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("[SelectFlight] CLICK fired", offerId);
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FlightResultCard.tsx:115',message:'[SelectFlight] CLICK fired',data:{offerId},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
              // #endregion
              
              if (!hasValidId) {
                console.error("[SelectFlight] BLOCKED - Missing offer ID", { offerId, flight });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FlightResultCard.tsx:122',message:'[SelectFlight] BLOCKED - Missing offer ID',data:{offerId,flight},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'D'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
                // #endregion
                return;
              }
              
              if (onSelect) {
                const normalizedFlight = { ...flight, id: offerId };
                console.log("[SelectFlight] Calling onSelect with normalized flight", { offerId, normalizedFlight });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FlightResultCard.tsx:132',message:'[SelectFlight] Calling onSelect with normalized flight',data:{offerId,normalizedFlight},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
                // #endregion
                onSelect(normalizedFlight);
              } else {
                console.warn("[SelectFlight] onSelect handler missing", { offerId });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FlightResultCard.tsx:139',message:'[SelectFlight] onSelect handler missing',data:{offerId},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'B'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
                // #endregion
              }
            }}
          >
            Select Flight →
          </button>
        </div>
      </div>
    </EcoviraCard>
  );
}