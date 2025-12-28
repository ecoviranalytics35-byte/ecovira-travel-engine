"use client";

import { EcoviraCard } from '../../components/EcoviraCard';
import { EcoviraButton } from '../../components/Button';
import { Input } from '../../components/Input';
import { DatePicker } from '../../components/DatePicker';
import { CurrencySelector } from '../../components/CurrencySelector';

export default function Cars() {
  return (
    <>
      {/* Page Title */}
      <div className="mb-16 md:mb-20 lg:mb-24">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-ec-text mb-6">
          Search Cars
        </h1>
        <p className="text-ec-muted text-xl md:text-2xl mt-4">
          Premium car rentals with concierge support
        </p>
      </div>

      {/* Engine Search Card - Horizontal Layout */}
      <div className="ec-card mb-20">
        {/* Single Row: All Fields Horizontally */}
        <div className="ec-grid-6 mb-8">
          <div>
            <label>Pickup Location</label>
            <Input placeholder="City or Airport" disabled />
          </div>
          <div>
            <DatePicker
              value=""
              onChange={() => {}}
              placeholder="Select pickup date"
              label="Pickup Date"
              disabled
            />
          </div>
          <div>
            <DatePicker
              value=""
              onChange={() => {}}
              placeholder="Select return date"
              label="Return Date"
              disabled
            />
          </div>
          <div>
            <label>Driver Age</label>
            <Input type="number" placeholder="25+" disabled />
          </div>
          <div className="col-span-2"></div>
        </div>

        {/* Row 2: Currency + CTA */}
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1 max-w-[300px]">
            <CurrencySelector
              value="AUD"
              onChange={() => {}}
              showCrypto={true}
            />
          </div>
          <div className="flex-shrink-0">
            <EcoviraButton 
              size="lg"
              className="min-w-[320px]"
              disabled
            >
              Search Cars →
            </EcoviraButton>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <EcoviraCard variant="glass" className="text-center py-16 md:py-20 px-6">
        <div className="text-6xl mb-8 text-ec-muted font-light">Coming Soon</div>
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-4">
          Car Rentals Coming Soon
        </h2>
        <p className="text-lg text-ec-muted mb-8 max-w-md mx-auto">
          Our premium car rental service is currently under development. Contact concierge support to be notified when this feature becomes available.
        </p>
        <EcoviraButton 
          variant="secondary" 
          size="lg"
          className="px-8 h-[52px]"
          disabled
        >
          Notify Me
        </EcoviraButton>
      </EcoviraCard>
    </>
  );
}

