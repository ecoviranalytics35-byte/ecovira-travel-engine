"use client";

import { useState } from 'react';
import type { InsuranceSelection } from '@/lib/core/booking-extras';
import { EXTRAS_PRICING } from '@/lib/core/booking-extras';
import { Shield } from 'lucide-react';

interface InsuranceSelectorProps {
  currency: string;
  passengerCount: number;
  onInsuranceChange: (insurance: InsuranceSelection | null) => void;
  initialInsurance?: InsuranceSelection | null;
}

export function InsuranceSelector({ currency, passengerCount, onInsuranceChange, initialInsurance }: InsuranceSelectorProps) {
  const [insurance, setInsurance] = useState<InsuranceSelection | null>(initialInsurance || null);
  const [selectedType, setSelectedType] = useState<'basic' | 'premium' | null>(insurance?.type || null);
  
  const insuranceOptions = [
    {
      type: 'basic' as const,
      label: 'Basic Travel Insurance',
      price: EXTRAS_PRICING.insurance.basic,
      features: ['Trip cancellation', 'Medical emergencies', 'Baggage loss'],
    },
    {
      type: 'premium' as const,
      label: 'Premium Travel Insurance',
      price: EXTRAS_PRICING.insurance.premium,
      features: ['All basic coverage', 'Trip interruption', 'Cancel for any reason', 'Higher limits'],
    },
  ];
  
  const handleInsuranceToggle = (type: 'basic' | 'premium') => {
    if (selectedType === type) {
      // Deselect
      setSelectedType(null);
      setInsurance(null);
      onInsuranceChange(null);
    } else {
      // Select
      setSelectedType(type);
      const option = insuranceOptions.find(opt => opt.type === type)!;
      const totalPrice = EXTRAS_PRICING.insurance.perPassenger 
        ? option.price * passengerCount 
        : option.price;
      
      const newInsurance: InsuranceSelection = {
        selected: true,
        type,
        price: totalPrice,
        currency,
        perPassenger: EXTRAS_PRICING.insurance.perPassenger,
      };
      setInsurance(newInsurance);
      onInsuranceChange(newInsurance);
    }
  };
  
  return (
    <div className="space-y-4" style={{ color: '#FFFFFF' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield size={20} className="text-ec-teal" />
            Travel Insurance
          </h3>
          <p className="text-sm text-white/70">Optional protection for your trip</p>
        </div>
        {insurance && (
          <div className="text-right">
            <div className="text-sm text-white/70">Insurance</div>
            <div className="text-lg font-semibold text-white">
              {currency} {insurance.price.toFixed(2)}
              {insurance.perPassenger && ` (${passengerCount} passenger${passengerCount > 1 ? 's' : ''})`}
            </div>
          </div>
        )}
      </div>
      
      {/* Insurance Options */}
      <div className="space-y-3">
        {insuranceOptions.map((option) => {
          const isSelected = selectedType === option.type;
          const totalPrice = EXTRAS_PRICING.insurance.perPassenger 
            ? option.price * passengerCount 
            : option.price;
          
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => handleInsuranceToggle(option.type)}
              className={`w-full p-6 rounded-ec-md border-2 transition-all text-left ${
                isSelected
                  ? 'bg-gradient-to-br from-[rgba(28,140,130,0.2)] to-[rgba(28,140,130,0.1)] border-ec-teal shadow-[0_0_12px_rgba(28,140,130,0.2)]'
                  : 'bg-[rgba(15,17,20,0.6)] border-[rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.5)] hover:bg-[rgba(15,17,20,0.7)]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => handleInsuranceToggle(option.type)}
                      className="w-5 h-5 text-ec-teal focus:ring-ec-teal"
                    />
                    <div className="text-lg font-bold text-white">{option.label}</div>
                  </div>
                  <ul className="text-sm text-white/70 space-y-1.5 ml-8">
                    {option.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-ec-teal">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white mb-1">
                    {currency} {totalPrice.toFixed(2)}
                  </div>
                  {EXTRAS_PRICING.insurance.perPassenger && (
                    <div className="text-sm text-white/70">
                      {currency} {option.price.toFixed(2)} per passenger
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Disclaimer */}
      <div className="p-3 bg-[rgba(200,162,77,0.1)] rounded-ec-md border border-[rgba(200,162,77,0.2)]">
        <p className="text-xs text-white/70">
          <strong className="text-ec-gold">Note:</strong> Travel insurance is provided by a third-party provider. 
          Terms and conditions apply. Review coverage details before purchase.
        </p>
      </div>
    </div>
  );
}

