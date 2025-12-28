import { FlightResult } from '@/lib/core/types';
import { EcoviraCard } from './EcoviraCard';
import { EcoviraDivider } from './EcoviraDivider';
import { EcoviraButton } from './Button';
import { EcoviraBadge } from './Badge';

interface FlightResultCardProps {
  flight: FlightResult;
  onSelect?: (flight: FlightResult) => void;
}

export function FlightResultCard({ flight, onSelect }: FlightResultCardProps) {
  // Mock additional data for display
  const airline = flight.provider || 'Mock Airlines';
  const duration = '2h 30m';
  const stops = 'Nonstop';
  const departureTime = '10:30 AM';
  const arrivalTime = '1:00 PM';
  const serviceFee = '15.00';

  return (
    <EcoviraCard variant="glass" className="p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Info Block */}
        <div className="col-span-8">
          <div className="space-y-4">
            {/* Airline Name */}
            <div className="text-lg font-semibold text-ec-text-primary">
              {airline}
            </div>

            {/* Route */}
            <div className="text-ec-teal-primary font-semibold">
              {flight.from} → {flight.to}
            </div>

            {/* Departure & Arrival */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-ec-teal-primary mb-2">
                  Departure
                </div>
                <div className="text-base font-semibold text-ec-text-primary">
                  {departureTime}
                </div>
                <div className="text-sm text-ec-text-secondary">
                  {flight.from}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-ec-teal-primary mb-2">
                  Arrival
                </div>
                <div className="text-base font-semibold text-ec-text-primary">
                  {arrivalTime}
                </div>
                <div className="text-sm text-ec-text-secondary">
                  {flight.to}
                </div>
              </div>
            </div>

            {/* Details Row */}
            <div className="flex items-center gap-4 text-sm text-ec-text-secondary">
              <span className="flex items-center gap-1">
                <span className="text-ec-teal-primary">⏱️</span>
                {duration}
              </span>
              <span className="flex items-center gap-1">
                <span className="text-ec-teal-primary">🛑</span>
                {stops}
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="col-span-1 flex justify-center">
          <EcoviraDivider orientation="vertical" />
        </div>

        {/* Right Price Block */}
        <div className="col-span-3 flex flex-col items-end justify-between">
          <div className="text-right">
            {/* Total Price */}
            <div className="text-4xl font-bold text-ec-text-primary mb-1">
              {flight.currency} {flight.price}
            </div>
            <div className="text-sm text-ec-text-secondary mb-4">
              per person
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-ec-text-secondary">Base fare</span>
                <span className="text-ec-text-primary">{flight.currency} {(Number(flight.price) - Number(serviceFee)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ec-gold-primary font-medium">Service fee</span>
                <span className="text-ec-gold-primary font-medium">{flight.currency} {serviceFee}</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <EcoviraButton
            size="lg"
            className="w-full mt-4"
            onClick={() => onSelect?.(flight)}
          >
            Select Flight →
          </EcoviraButton>
        </div>
      </div>
    </EcoviraCard>
  );
}