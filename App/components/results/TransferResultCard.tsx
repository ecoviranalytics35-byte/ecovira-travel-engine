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
          <EcoviraButton
            size="lg"
            variant="primary"
            className="w-full min-w-[200px] ec-btn-primary"
            onClick={() => onSelect?.(transfer)}
          >
            Select Transfer →
          </EcoviraButton>
        </div>
      </div>
    </EcoviraCard>
  );
}

