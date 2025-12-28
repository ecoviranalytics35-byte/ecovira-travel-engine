import { StayResult } from '@/lib/core/types';
import { EcoviraCard } from '../EcoviraCard';
import { EcoviraButton } from '../Button';

interface StayResultCardProps {
  stay: StayResult;
  onSelect?: (stay: StayResult) => void;
}

export function StayResultCard({ stay, onSelect }: StayResultCardProps) {
  return (
    <EcoviraCard variant="glass" className="p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Hotel Info */}
        <div className="md:col-span-8 space-y-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-2">
              {stay.name}
            </h3>
            <p className="text-lg text-ec-muted">{stay.city}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Check-in
              </div>
              <div className="text-ec-text font-medium">{stay.checkIn}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Nights
              </div>
              <div className="text-ec-text font-medium">{stay.nights}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Room Type
              </div>
              <div className="text-ec-text font-medium capitalize">{stay.roomType}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Class
              </div>
              <div className="text-ec-text font-medium capitalize">{stay.classType}</div>
            </div>
          </div>
        </div>

        {/* Right: Price + CTA */}
        <div className="md:col-span-4 flex flex-col items-end justify-between">
          <div className="text-right w-full mb-4">
            <div className="text-4xl md:text-5xl font-bold text-ec-text mb-2">
              {stay.currency} {stay.total}
            </div>
            <p className="text-sm text-ec-muted">total</p>
          </div>
          <button
            onClick={() => onSelect?.(stay)}
            className="w-full px-6 py-3 min-w-[200px] rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold text-sm shadow-[0_0_8px_rgba(28,140,130,0.3),0_0_16px_rgba(28,140,130,0.2)] hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.7)] hover:from-[rgba(28,140,130,0.5)] hover:to-[rgba(28,140,130,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            Select Stay →
          </button>
        </div>
      </div>
    </EcoviraCard>
  );
}

