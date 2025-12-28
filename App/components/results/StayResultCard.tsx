"use client";

import { StayResult } from '@/lib/core/types';
import { EcoviraCard } from '../EcoviraCard';
import { EcoviraButton } from '../Button';

interface StayResultCardProps {
  stay: StayResult;
  onSelect?: (stay: StayResult) => void;
}

export function StayResultCard({ stay, onSelect }: StayResultCardProps) {
  // Calculate check-out date from check-in + nights
  const getCheckOutDate = () => {
    if (!stay.checkIn || !stay.nights) return 'N/A';
    try {
      // Handle both YYYY-MM-DD format and other formats
      const checkInStr = String(stay.checkIn);
      const checkInDate = new Date(checkInStr);
      
      // Validate date
      if (isNaN(checkInDate.getTime())) {
        return 'N/A';
      }
      
      const checkOutDate = new Date(checkInDate);
      const nights = Number(stay.nights) || 0;
      checkOutDate.setDate(checkOutDate.getDate() + nights);
      
      return checkOutDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
      console.error('Error calculating check-out date:', error, { checkIn: stay.checkIn, nights: stay.nights });
      return 'N/A';
    }
  };

  // Format check-in date
  const formatCheckInDate = () => {
    if (!stay.checkIn) return 'N/A';
    try {
      const checkInStr = String(stay.checkIn);
      const date = new Date(checkInStr);
      
      // Validate date
      if (isNaN(date.getTime())) {
        return checkInStr; // Return original if invalid
      }
      
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
      return String(stay.checkIn);
    }
  };

  return (
    <EcoviraCard variant="glass" className="p-6 md:p-8 relative">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pointer-events-auto">
        {/* Left: Hotel Info */}
        <div className="md:col-span-8 space-y-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-2">
              {stay.name}
            </h3>
            <p className="text-lg text-ec-muted">{stay.city}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Check-in
              </div>
              <div className="text-ec-text font-medium">{formatCheckInDate()}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Check-out
              </div>
              <div className="text-ec-text font-medium">
                {getCheckOutDate()}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Nights
              </div>
              <div className="text-ec-text font-medium">{stay.nights || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Room Type
              </div>
              <div className="text-ec-text font-medium capitalize">{stay.roomType || 'Standard'}</div>
            </div>
          </div>
        </div>

        {/* Right: Price + CTA */}
        <div className="md:col-span-4 flex flex-col items-end justify-between pointer-events-auto">
          <div className="text-right w-full mb-4">
            <div className="text-4xl md:text-5xl font-bold text-ec-text mb-2">
              {stay.currency} {stay.total}
            </div>
            <p className="text-sm text-ec-muted">total</p>
          </div>
          <button
            type="button"
            className="relative z-[9999] pointer-events-auto cursor-pointer w-full px-6 py-3 min-w-[200px] rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold text-sm shadow-[0_0_8px_rgba(28,140,130,0.3),0_0_16px_rgba(28,140,130,0.2)] hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.7)] hover:from-[rgba(28,140,130,0.5)] hover:to-[rgba(28,140,130,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("[SelectStay] POINTERDOWN fired", stay.id);
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StayResultCard.tsx:108',message:'[SelectStay] POINTERDOWN fired',data:{stayId:stay.id},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              if (onSelect) {
                onSelect(stay);
              } else {
                console.warn("[SelectStay] onSelect handler missing", { stayId: stay.id });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StayResultCard.tsx:117',message:'[SelectStay] onSelect handler missing',data:{stayId:stay.id},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("[SelectStay] CLICK fired", stay.id);
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StayResultCard.tsx:127',message:'[SelectStay] CLICK fired',data:{stayId:stay.id},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              if (onSelect) {
                onSelect(stay);
              } else {
                console.warn("[SelectStay] onSelect handler missing", { stayId: stay.id });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StayResultCard.tsx:137',message:'[SelectStay] onSelect handler missing',data:{stayId:stay.id},timestamp:Date.now(),sessionId:'debug-session',runId:'click-fix',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
              }
            }}
          >
            Select Stay →
          </button>
        </div>
      </div>
    </EcoviraCard>
  );
}

