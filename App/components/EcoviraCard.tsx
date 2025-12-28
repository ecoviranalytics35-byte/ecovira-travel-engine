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
          'rounded-ec-card transition-all duration-300',
          {
            'bg-ec-bg-glass border border-ec-teal-border shadow-ec-glass hover:bg-ec-bg-glass-hover hover:border-ec-teal-border-hover hover:shadow-ec-glass-hover hover:-translate-y-1': variant === 'glass',
            'bg-ec-bg-glass-hover border border-ec-teal-border-hover shadow-ec-glass-hover': variant === 'glass-hover',
          },
          className
        )}
        {...props}
      />
    );
  }
);

EcoviraCard.displayName = 'EcoviraCard';