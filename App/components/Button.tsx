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
          'font-semibold transition-all duration-300 font-sans',
          {
            // Primary: dark gradient + gold edge + teal hover glow
            'bg-gradient-to-b from-[rgba(21,24,29,0.95)] to-[rgba(15,17,20,0.95)] border border-[rgba(200,162,77,0.35)] text-ec-text shadow-[0_20px_60px_rgba(0,0,0,0.55)] hover:-translate-y-[1px] hover:border-[rgba(28,140,130,0.55)] hover:shadow-[0_0_0_1px_rgba(28,140,130,0.25),0_22px_70px_rgba(0,0,0,0.60)] active:translate-y-[1px]': variant === 'primary',
            // Secondary: dark glass + teal border
            'bg-[rgba(15,17,20,0.45)] border border-[rgba(28,140,130,0.30)] text-ec-text hover:border-[rgba(28,140,130,0.55)]': variant === 'secondary',
            // Ghost: no border, text only
            'border-0 bg-transparent text-ec-muted hover:text-ec-text': variant === 'ghost',
          },
          {
            'px-4 py-2 text-sm rounded-ec-md': size === 'sm',
            'px-6 py-3 text-base rounded-ec-md': size === 'md',
            'px-8 py-4 text-lg rounded-ec-md': size === 'lg',
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