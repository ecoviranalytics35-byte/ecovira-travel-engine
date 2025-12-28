import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

interface EcoviraCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glass-hover';
}

export const EcoviraCard = forwardRef<HTMLDivElement, EcoviraCardProps>(
  ({ variant = 'glass', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-ec-lg transition-all duration-300',
          {
            'bg-ec-card border border-[rgba(28,140,130,0.22)] shadow-ec-card hover:border-[rgba(28,140,130,0.45)] hover:-translate-y-[2px]': variant === 'glass',
            'bg-ec-card-2 border border-[rgba(28,140,130,0.30)] shadow-ec-card': variant === 'glass-hover',
          },
          className
        )}
        {...props}
      />
    );
  }
);

EcoviraCard.displayName = 'EcoviraCard';