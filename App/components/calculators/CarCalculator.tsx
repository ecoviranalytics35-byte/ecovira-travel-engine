"use client";

import { useState } from 'react';
import { EcoviraCard } from '../EcoviraCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CarCalculatorProps {
  results: any[];
  days: number;
}

export function CarCalculator({ results, days }: CarCalculatorProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fuelEstimate, setFuelEstimate] = useState('');

  if (results.length === 0) return null;

  const bestOption = results[0];

  const toggleSection = (section: string) => {
    setExpanded(expanded === section ? null : section);
  };

  return (
    <EcoviraCard variant="glass" className="p-5">
      <h3 className="text-lg font-serif font-semibold text-ec-text mb-4">
        AI Car Rental Insights
      </h3>

      {/* Total Rental Estimate */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('rental')}
          className="w-full flex items-center justify-between p-3 bg-[rgba(28,140,130,0.08)] rounded-ec-sm hover:bg-[rgba(28,140,130,0.12)] transition-colors"
        >
          <span className="text-sm font-medium text-ec-text">Total Rental Estimate</span>
          {expanded === 'rental' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded === 'rental' && (
          <div className="mt-3 p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ec-muted">Daily rate:</span>
              <span className="text-ec-text">{bestOption.currency || 'USD'} {(parseFloat(bestOption.total || '0') / days).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ec-muted">Days:</span>
              <span className="text-ec-text">{days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ec-muted">Insurance estimate:</span>
              <span className="text-ec-text">{bestOption.currency || 'USD'} {(parseFloat(bestOption.total || '0') * 0.15).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[rgba(28,140,130,0.15)]">
              <span className="text-ec-text font-semibold">Total:</span>
              <span className="text-ec-text font-semibold">{bestOption.currency || 'USD'} {(parseFloat(bestOption.total || '0') * 1.15).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Fuel Estimate */}
      <div>
        <button
          onClick={() => toggleSection('fuel')}
          className="w-full flex items-center justify-between p-3 bg-[rgba(28,140,130,0.08)] rounded-ec-sm hover:bg-[rgba(28,140,130,0.12)] transition-colors"
        >
          <span className="text-sm font-medium text-ec-text">Fuel Estimate</span>
          {expanded === 'fuel' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded === 'fuel' && (
          <div className="mt-3 p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm space-y-2">
            <input
              type="number"
              placeholder="Enter estimated distance (km)"
              value={fuelEstimate}
              onChange={(e) => setFuelEstimate(e.target.value)}
              className="w-full h-10 px-3 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-sm text-ec-text text-sm"
            />
            {fuelEstimate && (
              <div className="text-sm text-ec-text mt-2">
                Estimated fuel cost: {bestOption.currency} {(parseFloat(fuelEstimate) * 0.15).toFixed(2)}
              </div>
            )}
          </div>
        )}
      </div>
    </EcoviraCard>
  );
}

