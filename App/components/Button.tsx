import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';
import { Slot } from '@radix-ui/react-slot';

interface EcoviraButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export const EcoviraButton = forwardRef<HTMLButtonElement, EcoviraButtonProps>(
  ({ variant = 'primary', size = 'md', asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          'font-medium transition-all duration-300 font-sans',
          {
            'bg-ec-bg-glass border border-ec-teal-border text-ec-text-primary shadow-ec-button hover:border-ec-teal-border-hover hover:shadow-ec-button-hover hover:bg-ec-bg-glass-hover': variant === 'primary',
            'border border-ec-teal-border bg-transparent text-ec-text-primary hover:bg-ec-bg-glass hover:border-ec-teal-border-hover': variant === 'secondary',
            'text-ec-text-secondary hover:text-ec-text-primary': variant === 'ghost',
          },
          {
            'px-4 py-2 text-sm rounded-ec-input': size === 'sm',
            'px-6 py-3 text-base rounded-ec-button': size === 'md',
            'px-8 py-4 text-lg rounded-ec-button': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

EcoviraButton.displayName = 'EcoviraButton';