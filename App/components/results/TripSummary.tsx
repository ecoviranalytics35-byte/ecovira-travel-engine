"use client";

import { EcoviraCard } from '../EcoviraCard';

interface TripSummaryProps {
  from?: string;
  to?: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  cabinClass?: string;
  tripType?: string;
}

export function TripSummary({
  from,
  to,
  departDate,
  returnDate,
  adults,
  cabinClass,
  tripType,
}: TripSummaryProps) {
  if (!from || !to) return null;

  return (
    <EcoviraCard variant="glass" className="p-5">
      <h3 className="text-lg font-serif font-semibold text-ec-text mb-4">
        Trip Summary
      </h3>
      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs text-ec-muted uppercase tracking-[0.12em] mb-1">Route</div>
          <div className="text-ec-text font-medium">{from} → {to}</div>
        </div>
        <div>
          <div className="text-xs text-ec-muted uppercase tracking-[0.12em] mb-1">Departure</div>
          <div className="text-ec-text font-medium">{departDate || 'Not set'}</div>
        </div>
        {tripType === 'roundtrip' && returnDate && (
          <div>
            <div className="text-xs text-ec-muted uppercase tracking-[0.12em] mb-1">Return</div>
            <div className="text-ec-text font-medium">{returnDate}</div>
          </div>
        )}
        <div>
          <div className="text-xs text-ec-muted uppercase tracking-[0.12em] mb-1">Passengers</div>
          <div className="text-ec-text font-medium">{adults || 1} {adults === 1 ? 'adult' : 'adults'}</div>
        </div>
        {cabinClass && (
          <div>
            <div className="text-xs text-ec-muted uppercase tracking-[0.12em] mb-1">Cabin</div>
            <div className="text-ec-text font-medium capitalize">{cabinClass.replace('_', ' ')}</div>
          </div>
        )}
      </div>
    </EcoviraCard>
  );
}

