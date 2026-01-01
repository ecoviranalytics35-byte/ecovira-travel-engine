"use client";

import { useState } from 'react';
import type { BaggageSelection } from '@/lib/core/booking-extras';
import { EXTRAS_PRICING } from '@/lib/core/booking-extras';
import { Luggage } from 'lucide-react';

interface BaggageSelectorProps {
  currency: string;
  onBaggageChange: (baggage: BaggageSelection) => void;
  initialBaggage?: BaggageSelection;
}

export function BaggageSelector({ currency, onBaggageChange, initialBaggage }: BaggageSelectorProps) {
  const [baggage, setBaggage] = useState<BaggageSelection>(
    initialBaggage || {
      carryOn: true, // Always included
      checkedBags: [],
    }
  );
  
  const baggageOptions = [
    { type: '20kg' as const, label: '20kg Checked Bag', price: EXTRAS_PRICING.baggage['20kg'] },
    { type: '30kg' as const, label: '30kg Checked Bag', price: EXTRAS_PRICING.baggage['30kg'] },
    { type: 'extra' as const, label: 'Extra Bag', price: EXTRAS_PRICING.baggage.extra },
  ];
  
  const handleAddBag = (type: '20kg' | '30kg' | 'extra') => {
    const option = baggageOptions.find(opt => opt.type === type)!;
    const newBags = [
      ...baggage.checkedBags,
      { type, quantity: 1, price: option.price, currency },
    ];
    const newBaggage = { ...baggage, checkedBags: newBags };
    setBaggage(newBaggage);
    onBaggageChange(newBaggage);
  };
  
  const handleRemoveBag = (index: number) => {
    const newBags = baggage.checkedBags.filter((_, i) => i !== index);
    const newBaggage = { ...baggage, checkedBags: newBags };
    setBaggage(newBaggage);
    onBaggageChange(newBaggage);
  };
  
  const totalBaggagePrice = baggage.checkedBags.reduce((sum, bag) => sum + bag.price, 0);
  
  return (
    <div className="space-y-4" style={{ color: '#FFFFFF' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Luggage size={20} className="text-ec-teal" />
            Baggage
          </h3>
          <p className="text-sm text-white/70">Select your checked baggage options</p>
        </div>
        {totalBaggagePrice > 0 && (
          <div className="text-right">
            <div className="text-sm text-white/70">Baggage</div>
            <div className="text-lg font-semibold text-white">{currency} {totalBaggagePrice.toFixed(2)}</div>
          </div>
        )}
      </div>
      
      {/* Included Baggage */}
      <div className="p-4 bg-[rgba(28,140,130,0.1)] rounded-ec-md border border-[rgba(28,140,130,0.2)]">
        <div className="text-sm font-semibold text-white mb-1">Included:</div>
        <div className="text-sm text-white/70">1 × Carry-on bag (7kg, fits overhead)</div>
      </div>
      
      {/* Checked Baggage Options */}
      <div className="space-y-3">
        {baggageOptions.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => handleAddBag(option.type)}
            className="w-full p-5 bg-[rgba(15,17,20,0.6)] rounded-ec-md border-2 border-[rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.5)] hover:bg-[rgba(15,17,20,0.7)] transition-all text-left"
          >
            <div className="flex items-center justify-between" style={{ color: '#FFFFFF' }}>
              <div>
                <div className="text-lg font-semibold text-white mb-1" style={{ color: '#FFFFFF !important' }}>{option.label}</div>
                <div className="text-sm text-white/70" style={{ color: 'rgba(255,255,255,0.7) !important' }}>
                  {option.type === '20kg' && 'Standard checked baggage allowance'}
                  {option.type === '30kg' && 'Heavy baggage allowance'}
                  {option.type === 'extra' && 'Additional checked bag'}
                </div>
              </div>
              <div className="text-xl font-bold text-white" style={{ color: '#FFFFFF !important' }}>{currency} {option.price.toFixed(2)}</div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Selected Bags */}
      {baggage.checkedBags.length > 0 && (
        <div className="mt-4 p-5 bg-gradient-to-br from-[rgba(28,140,130,0.15)] to-[rgba(28,140,130,0.08)] rounded-ec-md border border-[rgba(28,140,130,0.3)]">
          <div className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ec-teal"></div>
            Selected Bags
          </div>
          <div className="space-y-3">
            {baggage.checkedBags.map((bag, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[rgba(15,17,20,0.5)] rounded-lg border border-[rgba(28,140,130,0.2)]">
                <div className="text-base font-medium text-white">
                  {bag.type === '20kg' && '20kg Checked Bag'}
                  {bag.type === '30kg' && '30kg Checked Bag'}
                  {bag.type === 'extra' && 'Extra Bag'}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base text-white font-semibold">{currency} {bag.price.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBag(index)}
                    className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-[rgba(200,50,50,0.1)] rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

