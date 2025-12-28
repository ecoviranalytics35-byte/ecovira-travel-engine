import { FlightResult } from '@/lib/core/types';
import { EcoviraCard } from './EcoviraCard';
import { EcoviraButton } from './Button';

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

  const basePrice = (Number(flight.price) - Number(serviceFee)).toFixed(2);

  return (
    <EcoviraCard variant="glass" className="p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        {/* Left Info Block - col-span-8 */}
        <div className="md:col-span-8 space-y-5">
          {/* Airline Name */}
          <div className="text-lg md:text-xl font-semibold text-ec-text">
            {airline}
          </div>

          {/* Route */}
          <div className="text-ec-teal font-semibold text-lg md:text-xl">
            {flight.from} → {flight.to}
          </div>

          {/* Departure & Arrival */}
          <div className="grid grid-cols-2 gap-6 md:gap-8">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-2">
                Departure
              </div>
              <div className="text-base md:text-lg font-semibold text-ec-text">
                {departureTime}
              </div>
              <div className="text-sm text-ec-muted">
                {flight.from}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-2">
                Arrival
              </div>
              <div className="text-base md:text-lg font-semibold text-ec-text">
                {arrivalTime}
              </div>
              <div className="text-sm text-ec-muted">
                {flight.to}
              </div>
            </div>
          </div>

          {/* Details Row */}
          <div className="flex items-center gap-4 text-sm text-ec-muted">
            <span className="flex items-center gap-1.5">
              <span className="text-ec-teal">⏱️</span>
              {duration}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-ec-teal">🛑</span>
              {stops}
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block md:col-span-1 flex justify-center">
          <div className="w-px h-full bg-[rgba(28,140,130,0.22)]"></div>
        </div>

        {/* Right Price Block - col-span-4 */}
        <div className="md:col-span-3 flex flex-col items-end justify-between">
          <div className="text-right w-full">
            {/* Total Price */}
            <div className="text-4xl md:text-[46px] font-bold text-ec-text mb-1">
              {flight.currency} {flight.price}
            </div>
            <div className="text-sm text-ec-muted mb-4">
              per person
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-ec-muted">Base fare</span>
                <span className="text-ec-text">{flight.currency} {basePrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ec-gold font-medium">Service fee</span>
                <span className="text-ec-gold font-medium">{flight.currency} {serviceFee}</span>
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