import { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/utils'; // assume we create this

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'font-medium transition-all duration-200',
        {
          'bg-ec-ink text-ec-bg border border-ec-gold hover:bg-ec-gold hover:shadow-ec-2': variant === 'primary',
          'border border-ec-border bg-ec-surface hover:bg-ec-surface-2': variant === 'secondary',
          'text-ec-ink hover:underline': variant === 'tertiary',
        },
        {
          'px-4 py-2 text-sm rounded-ec-md': size === 'sm',
          'px-6 py-3 text-base rounded-ec-md': size === 'md',
          'px-8 py-4 text-lg rounded-ec-lg': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}