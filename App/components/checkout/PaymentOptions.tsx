"use client";

import { useState } from 'react';
import { CreditCard, Wallet } from 'lucide-react';

export type PaymentMethod = 'card' | 'crypto';

interface PaymentOptionsProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  currency: string;
}

export function PaymentOptions({ selectedMethod, onMethodChange, currency }: PaymentOptionsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-ec-text mb-6">Payment Method</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Payment - Premium Large Card */}
        <button
          type="button"
          onClick={() => onMethodChange('card')}
          className={`p-8 rounded-ec-lg border-2 transition-all text-left min-h-[180px] ${
            selectedMethod === 'card'
              ? 'bg-gradient-to-br from-[rgba(28,140,130,0.2)] to-[rgba(28,140,130,0.1)] border-ec-teal shadow-[0_0_20px_rgba(28,140,130,0.3)]'
              : 'bg-[rgba(15,17,20,0.6)] border-[rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.5)] hover:bg-[rgba(15,17,20,0.7)]'
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`p-4 rounded-lg ${
                selectedMethod === 'card' ? 'bg-ec-teal' : 'bg-[rgba(28,140,130,0.2)]'
              }`}>
                <CreditCard size={32} className={selectedMethod === 'card' ? 'text-white' : 'text-ec-teal'} />
              </div>
              {selectedMethod === 'card' && (
                <div className="w-6 h-6 rounded-full bg-ec-teal flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>
              )}
            </div>
            <div>
              <div className="text-xl font-bold text-ec-text mb-2">Pay by Card</div>
              <div className="text-base text-ec-muted mb-1">Instant confirmation</div>
              <div className="text-sm text-ec-muted">Stripe / Airwallex</div>
            </div>
          </div>
        </button>
        
        {/* Crypto Payment - Premium Large Card */}
        <button
          type="button"
          onClick={() => onMethodChange('crypto')}
          className={`p-8 rounded-ec-lg border-2 transition-all text-left min-h-[180px] ${
            selectedMethod === 'crypto'
              ? 'bg-gradient-to-br from-[rgba(28,140,130,0.2)] to-[rgba(28,140,130,0.1)] border-ec-teal shadow-[0_0_20px_rgba(28,140,130,0.3)]'
              : 'bg-[rgba(15,17,20,0.6)] border-[rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.5)] hover:bg-[rgba(15,17,20,0.7)]'
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`p-4 rounded-lg ${
                selectedMethod === 'crypto' ? 'bg-ec-teal' : 'bg-[rgba(28,140,130,0.2)]'
              }`}>
                <Wallet size={32} className={selectedMethod === 'crypto' ? 'text-white' : 'text-ec-teal'} />
              </div>
              {selectedMethod === 'crypto' && (
                <div className="w-6 h-6 rounded-full bg-ec-teal flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>
              )}
            </div>
            <div>
              <div className="text-xl font-bold text-ec-text mb-2">Pay by Crypto</div>
              <div className="text-base text-ec-muted mb-1">Discount may apply</div>
              <div className="text-sm text-ec-muted">Trust Wallet / NOWPayments</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

