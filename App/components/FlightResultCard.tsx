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
  const airlineInitial = airline.charAt(0).toUpperCase();
  const duration = '4 Hours 5 Minutes';
  const stops = '1 Stop';
  const departureDate = 'Dec 05, 2025 14:40';
  const arrivalDate = 'Dec 05, 2025 16:15';
  
  // Calculate service fee (4% of base price)
  const basePriceNum = Number(flight.price) / 1.04;
  const serviceFeeNum = Number(flight.price) - basePriceNum;
  const taxesFees = (serviceFeeNum * 0.2).toFixed(2); // Mock taxes
  const serviceFee = serviceFeeNum.toFixed(2);
  const basePrice = basePriceNum.toFixed(2);

  return (
    <EcoviraCard variant="glass" className="p-8 md:p-10 lg:p-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
        {/* Left: Airline / Logo Block */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="text-xl md:text-2xl font-bold text-ec-text">
            {airline}
          </div>
          {/* Circular Logo Icon */}
          <div className="w-12 h-12 rounded-full bg-ec-teal flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{airlineInitial}</span>
          </div>
        </div>

        {/* Center-Left: Route + Times */}
        <div className="md:col-span-5 space-y-5">
          {/* Route - Teal, Bold */}
          <div className="text-ec-teal font-bold text-xl md:text-2xl">
            {flight.from} → {flight.to}
          </div>
          {/* Airport Codes */}
          <div className="text-sm text-ec-muted">
            {flight.from} and {flight.to}
          </div>
          
          {/* Departure and Arrival */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-2">
                DEPARTURE
              </div>
              <div className="text-lg md:text-xl font-bold text-ec-text">
                {departureDate}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-2">
                ARRIVAL
              </div>
              <div className="text-lg md:text-xl font-bold text-ec-text">
                {arrivalDate}
              </div>
            </div>
          </div>

          {/* Duration and Stops - Bottom Left */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-sm text-ec-muted">
              <span className="text-ec-teal">⏱️</span>
              <span>Duration: {duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ec-muted">
              <span className="text-ec-teal">🛑</span>
              <span>{stops}</span>
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block md:col-span-1 flex justify-center">
          <div className="w-px h-full bg-[rgba(28,140,130,0.22)]"></div>
        </div>

        {/* Right: Price Panel */}
        <div className="md:col-span-3 flex flex-col items-end justify-between">
          <div className="text-right w-full mb-6">
            {/* Total Price - Very Large and Dominant */}
            <div className="text-5xl md:text-6xl font-bold text-ec-text mb-3">
              {flight.currency}{flight.price}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-sm border-t border-[rgba(28,140,130,0.15)] pt-4">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-3">
                Price Breakdown:
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-ec-muted">Base Fare:</span>
                <span className="text-ec-text">{flight.currency}{basePrice}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-ec-muted">Taxes & Fees:</span>
                <span className="text-ec-text">{flight.currency}{taxesFees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ec-gold font-medium">Service Fee (4.0%):</span>
                <span className="text-ec-gold font-medium">{flight.currency}{serviceFee}</span>
              </div>
            </div>
          </div>

          {/* CTA Button - Large and Prominent */}
          <EcoviraButton
            size="lg"
            className="w-full min-w-[240px] h-[56px] text-lg font-semibold"
            onClick={() => onSelect?.(flight)}
          >
            Select Flight →
          </EcoviraButton>
        </div>
      </div>
    </EcoviraCard>
  );
}