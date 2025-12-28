import { CarResult } from '@/lib/core/types';
import { EcoviraCard } from '../EcoviraCard';
import { EcoviraButton } from '../Button';

interface CarResultCardProps {
  car: CarResult;
  onSelect?: (car: CarResult) => void;
}

export function CarResultCard({ car, onSelect }: CarResultCardProps) {
  return (
    <EcoviraCard variant="glass" className="p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Car Info */}
        <div className="md:col-span-8 space-y-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-2">
              {car.name || car.vehicle || 'Car Rental'}
            </h3>
            <p className="text-lg text-ec-muted">{car.category || car.vendor || 'Standard'}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Pickup
              </div>
              <div className="text-ec-text font-medium">{car.pickupLocation || car.pickup || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Return
              </div>
              <div className="text-ec-text font-medium">{car.returnLocation || car.dropoff || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Duration
              </div>
              <div className="text-ec-text font-medium">{car.duration ? `${car.duration} days` : 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Seats
              </div>
              <div className="text-ec-text font-medium">{car.seats || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Right: Price + CTA */}
        <div className="md:col-span-4 flex flex-col items-end justify-between">
          <div className="text-right w-full mb-4">
            <div className="text-4xl md:text-5xl font-bold text-ec-text mb-2">
              {car.currency} {car.total}
            </div>
            <p className="text-sm text-ec-muted">total</p>
          </div>
          <button
            onClick={() => onSelect?.(car)}
            className="w-full px-6 py-3 min-w-[200px] rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold text-sm shadow-[0_0_8px_rgba(28,140,130,0.3),0_0_16px_rgba(28,140,130,0.2)] hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.7)] hover:from-[rgba(28,140,130,0.5)] hover:to-[rgba(28,140,130,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            Select Car →
          </button>
        </div>
      </div>
    </EcoviraCard>
  );
}

