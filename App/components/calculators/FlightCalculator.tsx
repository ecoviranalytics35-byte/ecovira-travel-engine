"use client";

import { useState } from 'react';
import { EcoviraCard } from '../EcoviraCard';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FlightCalculatorProps {
  results: any[];
}

export function FlightCalculator({ results }: FlightCalculatorProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (results.length === 0) return null;

  // Calculate best options
  const cheapest = results.reduce((min, f) => 
    parseFloat(f.price || 0) < parseFloat(min.price || 0) ? f : min, results[0]
  );
  
  // Calculate fastest (using duration if available, otherwise estimate from price)
  const fastest = results.reduce((min, f) => {
    const minDuration = parseFloat(min.duration || '999') || 999;
    const fDuration = parseFloat(f.duration || '999') || 999;
    return fDuration < minDuration ? f : min;
  }, results[0]);
  
  // Calculate best value (price per hour, lower is better)
  const bestValue = results.reduce((best, f) => {
    const bestPrice = parseFloat(best.price || 0);
    const fPrice = parseFloat(f.price || 0);
    const bestDuration = parseFloat(best.duration || '4') || 4;
    const fDuration = parseFloat(f.duration || '4') || 4;
    const bestRatio = bestPrice / bestDuration;
    const fRatio = fPrice / fDuration;
    return fRatio < bestRatio ? f : best;
  }, results[0]);

  const toggleSection = (section: string) => {
    setExpanded(expanded === section ? null : section);
  };

  return (
    <EcoviraCard variant="glass" className="p-5">
      <h3 className="text-lg font-serif font-semibold text-ec-text mb-4">
        AI Flight Insights
      </h3>

      {/* Best Options Summary */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('best')}
          className="w-full flex items-center justify-between p-3 bg-[rgba(28,140,130,0.08)] rounded-ec-sm hover:bg-[rgba(28,140,130,0.12)] transition-colors"
        >
          <span className="text-sm font-medium text-ec-text">Best Options</span>
          {expanded === 'best' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded === 'best' && (
          <div className="mt-3 space-y-3 pl-3">
            <div className="p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm">
              <div className="text-xs text-ec-muted mb-1">Cheapest</div>
              <div className="text-ec-text font-semibold">
                {cheapest.currency} {cheapest.price} • {cheapest.from} → {cheapest.to}
              </div>
            </div>
            <div className="p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm">
              <div className="text-xs text-ec-muted mb-1">Fastest</div>
              <div className="text-ec-text font-semibold">
                {fastest.currency} {fastest.price} • {fastest.duration || '4h'} duration
              </div>
            </div>
            <div className="p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm border border-[rgba(200,162,77,0.25)]">
              <div className="text-xs text-ec-gold mb-1">Best Value</div>
              <div className="text-ec-text font-semibold">
                {bestValue.currency} {bestValue.price} • Best price/duration ratio
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Service Fee Estimator */}
      <div>
        <button
          onClick={() => toggleSection('fee')}
          className="w-full flex items-center justify-between p-3 bg-[rgba(28,140,130,0.08)] rounded-ec-sm hover:bg-[rgba(28,140,130,0.12)] transition-colors"
        >
          <span className="text-sm font-medium text-ec-text">Service Fee Calculator</span>
          {expanded === 'fee' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded === 'fee' && (
          <div className="mt-3 p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ec-muted">Base Price:</span>
              <span className="text-ec-text">{cheapest.currency || 'USD'} {(parseFloat(cheapest.price || '0') / 1.04).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ec-muted">Service Fee (4%):</span>
              <span className="text-ec-gold">+{cheapest.currency || 'USD'} {(parseFloat(cheapest.price || '0') * 0.04 / 1.04).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[rgba(28,140,130,0.15)]">
              <span className="text-ec-text font-semibold">Total:</span>
              <span className="text-ec-text font-semibold">{cheapest.currency || 'USD'} {cheapest.price || '0.00'}</span>
            </div>
          </div>
        )}
      </div>
    </EcoviraCard>
  );
}

