"use client";

import { useState } from 'react';
import { FlightResult } from '@/lib/core/types';
import { EcoviraCard } from './EcoviraCard';
import { EcoviraButton } from './Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface FlightResultCardProps {
  flight: FlightResult;
  onSelect?: (flight: FlightResult) => void;
}

export function FlightResultCard({ flight, onSelect }: FlightResultCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Mock additional data for display
  const airline = flight.provider || 'Amadeus';
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
    <EcoviraCard variant="glass" className="p-6">
      <div className="max-w-[1100px] mx-auto">
        {/* Top Row: Airline + Price */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-ec-teal flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">{airlineInitial}</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-ec-text">{airline}</div>
              <div className="text-xs text-ec-muted mt-1">
                <span className="px-2 py-0.5 bg-[rgba(28,140,130,0.15)] rounded-full border border-[rgba(28,140,130,0.25)]">
                  Source: {airline}
                </span>
              </div>
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
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-2">
              Departure
            </div>
            <div className="text-lg font-bold text-ec-text mb-1">{departureDate}</div>
            <div className="text-sm text-ec-muted">{flight.from}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-2">
              Duration
            </div>
            <div className="text-lg font-bold text-ec-teal mb-1">{duration}</div>
            <div className="text-sm text-ec-muted">{stops}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-2">
              Arrival
            </div>
            <div className="text-lg font-bold text-ec-text mb-1">{arrivalDate}</div>
            <div className="text-sm text-ec-muted">{flight.to}</div>
          </div>
        </div>

        {/* Bottom: Price Breakdown + CTA */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-2 text-sm text-ec-muted hover:text-ec-text transition-colors"
          >
            {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>Price Breakdown</span>
          </button>
          <EcoviraButton
            size="md"
            variant="primary"
            className="ec-btn-primary min-w-[180px]"
            onClick={() => onSelect?.(flight)}
          >
            Select Flight →
          </EcoviraButton>
        </div>

        {/* Collapsible Price Breakdown */}
        {showBreakdown && (
          <div className="mt-4 pt-4 border-t border-[rgba(28,140,130,0.15)] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ec-muted">Base Fare:</span>
              <span className="text-ec-text">{flight.currency} {basePrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ec-muted">Taxes & Fees:</span>
              <span className="text-ec-text">{flight.currency} {taxesFees}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ec-gold font-medium">Service Fee (4.0%):</span>
              <span className="text-ec-gold font-medium">{flight.currency} {serviceFee}</span>
            </div>
          </div>
        )}
      </div>
    </EcoviraCard>
  );
}