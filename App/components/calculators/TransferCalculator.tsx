"use client";

import { useState } from 'react';
import { EcoviraCard } from '../EcoviraCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TransferCalculatorProps {
  results: any[];
}

export function TransferCalculator({ results }: TransferCalculatorProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (results.length === 0) return null;

  const bestOption = results[0];

  const toggleSection = (section: string) => {
    setExpanded(expanded === section ? null : section);
  };

  return (
    <EcoviraCard variant="glass" className="p-5">
      <h3 className="text-lg font-serif font-semibold text-ec-text mb-4">
        AI Transfer Insights
      </h3>

      {/* Price by Distance */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between p-3 bg-[rgba(28,140,130,0.08)] rounded-ec-sm hover:bg-[rgba(28,140,130,0.12)] transition-colors"
        >
          <span className="text-sm font-medium text-ec-text">Price Estimate</span>
          {expanded === 'price' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded === 'price' && (
          <div className="mt-3 p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm text-sm text-ec-text">
            Estimated price based on distance: {bestOption.currency || 'USD'} {bestOption.total || '0.00'}
          </div>
        )}
      </div>

      {/* Best Pickup Time */}
      <div>
        <button
          onClick={() => toggleSection('time')}
          className="w-full flex items-center justify-between p-3 bg-[rgba(28,140,130,0.08)] rounded-ec-sm hover:bg-[rgba(28,140,130,0.12)] transition-colors"
        >
          <span className="text-sm font-medium text-ec-text">Best Pickup Time</span>
          {expanded === 'time' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded === 'time' && (
          <div className="mt-3 p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm text-sm text-ec-text">
            For flight arrivals, we recommend booking your transfer 30-45 minutes after scheduled landing time to account for baggage claim and customs.
          </div>
        )}
      </div>
    </EcoviraCard>
  );
}

