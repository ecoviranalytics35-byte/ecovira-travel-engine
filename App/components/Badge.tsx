import { HTMLAttributes } from 'react';
import { cn } from '../lib/utils';

interface EcoviraBadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warn' | 'error' | 'info' | 'muted';
}

export function EcoviraBadge({ variant = 'muted', className, ...props }: EcoviraBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center px-3 py-1 text-xs font-medium rounded-ec-input bg-ec-bg-glass border',
        {
          'border-green-500/30 text-green-400': variant === 'success',
          'border-yellow-500/30 text-yellow-400': variant === 'warn',
          'border-red-500/30 text-red-400': variant === 'error',
          'border-blue-500/30 text-blue-400': variant === 'info',
          'border-ec-teal-border text-ec-text-secondary': variant === 'muted',
        },
        className
      )}
      {...props}
    />
  );
}