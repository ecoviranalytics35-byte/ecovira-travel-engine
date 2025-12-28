import { InputHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full px-4 py-3 bg-ec-surface border border-ec-border rounded-ec-md text-ec-ink placeholder-ec-muted focus:outline-none focus:ring-2 focus:ring-ec-teal/20 focus:border-ec-teal transition-colors',
        className
      )}
      {...props}
    />
  );
}