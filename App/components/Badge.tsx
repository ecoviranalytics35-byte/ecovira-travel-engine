import { HTMLAttributes } from 'react';
import { cn } from '../lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warn' | 'error' | 'info' | 'default';
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center px-3 py-1 text-xs font-medium rounded-ec-sm',
        {
          'bg-ec-success/10 text-ec-success': variant === 'success',
          'bg-ec-warn/10 text-ec-warn': variant === 'warn',
          'bg-ec-error/10 text-ec-error': variant === 'error',
          'bg-ec-info/10 text-ec-info': variant === 'info',
          'bg-ec-surface text-ec-ink': variant === 'default',
        },
        className
      )}
      {...props}
    />
  );
}