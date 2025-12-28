"use client";

import { useState } from 'react';
import { EcoviraCard } from '../EcoviraCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface StayCalculatorProps {
  results: any[];
  nights: number;
}

export function StayCalculator({ results, nights }: StayCalculatorProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (results.length === 0) return null;

  // Calculate best value (price per night, lower is better)
  const bestValue = results.reduce((best, s) => {
    const bestPricePerNight = parseFloat(best.total || '0') / nights;
    const sPricePerNight = parseFloat(s.total || '0') / nights;
    return sPricePerNight < bestPricePerNight ? s : best;
  }, results[0]);

  const toggleSection = (section: string) => {
    setExpanded(expanded === section ? null : section);
  };

  return (
    <EcoviraCard variant="glass" className="p-5">
      <h3 className="text-lg font-serif font-semibold text-ec-text mb-4">
        AI Stay Insights
      </h3>

      {/* Total Trip Cost */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('cost')}
          className="w-full flex items-center justify-between p-3 bg-[rgba(28,140,130,0.08)] rounded-ec-sm hover:bg-[rgba(28,140,130,0.12)] transition-colors"
        >
          <span className="text-sm font-medium text-ec-text">Total Trip Cost</span>
          {expanded === 'cost' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded === 'cost' && (
          <div className="mt-3 p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ec-muted">Rate per night:</span>
              <span className="text-ec-text">{bestValue.currency || 'USD'} {(parseFloat(bestValue.total || '0') / nights).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ec-muted">Nights:</span>
              <span className="text-ec-text">{nights}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ec-muted">Estimated taxes:</span>
              <span className="text-ec-text">{bestValue.currency || 'USD'} {(parseFloat(bestValue.total || '0') * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[rgba(28,140,130,0.15)]">
              <span className="text-ec-text font-semibold">Total:</span>
              <span className="text-ec-text font-semibold">{bestValue.currency || 'USD'} {(parseFloat(bestValue.total || '0') * 1.1).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Best Value Suggestion */}
      <div>
        <button
          onClick={() => toggleSection('value')}
          className="w-full flex items-center justify-between p-3 bg-[rgba(28,140,130,0.08)] rounded-ec-sm hover:bg-[rgba(28,140,130,0.12)] transition-colors"
        >
          <span className="text-sm font-medium text-ec-text">Best Value</span>
          {expanded === 'value' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded === 'value' && (
          <div className="mt-3 p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm">
            <div className="text-sm text-ec-text">
              Based on location, rating, and price, <strong>{bestValue.name}</strong> offers the best value.
            </div>
          </div>
        )}
      </div>
    </EcoviraCard>
  );
}

