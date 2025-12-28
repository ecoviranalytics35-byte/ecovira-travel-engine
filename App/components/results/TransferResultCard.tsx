import { TransferResult } from '@/lib/core/types';
import { EcoviraCard } from '../EcoviraCard';
import { EcoviraButton } from '../Button';

interface TransferResultCardProps {
  transfer: TransferResult;
  onSelect?: (transfer: TransferResult) => void;
}

export function TransferResultCard({ transfer, onSelect }: TransferResultCardProps) {
  return (
    <EcoviraCard variant="glass" className="p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Transfer Info */}
        <div className="md:col-span-8 space-y-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-2">
              {transfer.name}
            </h3>
            <p className="text-lg text-ec-muted">{transfer.type}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                From
              </div>
              <div className="text-ec-text font-medium">{transfer.from}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                To
              </div>
              <div className="text-ec-text font-medium">{transfer.to}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-1">
                Passengers
              </div>
              <div className="text-ec-text font-medium">{transfer.passengers}</div>
            </div>
          </div>
        </div>

        {/* Right: Price + CTA */}
        <div className="md:col-span-4 flex flex-col items-end justify-between">
          <div className="text-right w-full mb-4">
            <div className="text-4xl md:text-5xl font-bold text-ec-text mb-2">
              {transfer.currency} {transfer.total}
            </div>
            <p className="text-sm text-ec-muted">total</p>
          </div>
          <button
            onClick={() => onSelect?.(transfer)}
            className="w-full px-6 py-3 min-w-[200px] rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold text-sm shadow-[0_0_8px_rgba(28,140,130,0.3),0_0_16px_rgba(28,140,130,0.2)] hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.7)] hover:from-[rgba(28,140,130,0.5)] hover:to-[rgba(28,140,130,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            Select Transfer →
          </button>
        </div>
      </div>
    </EcoviraCard>
  );
}

