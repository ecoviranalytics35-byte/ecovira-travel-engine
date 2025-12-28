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
            // Primary: teal→gold gradient + glow effect
            'bg-gradient-to-r from-[rgba(28,140,130,0.38)] via-[rgba(28,140,130,0.28)] to-[rgba(200,162,77,0.18)] border border-[rgba(200,162,77,0.34)] text-ec-text shadow-[0_0_0_1px_rgba(200,162,77,0.14),0_18px_60px_rgba(0,0,0,0.45),0_0_40px_rgba(28,140,130,0.20)] hover:-translate-y-[1px] hover:border-[rgba(200,162,77,0.50)] hover:shadow-[0_0_0_3px_rgba(200,162,77,0.16),0_22px_70px_rgba(0,0,0,0.55),0_0_55px_rgba(28,140,130,0.24)] active:translate-y-[1px]': variant === 'primary',
            // Secondary: dark glass + teal border + white text (explicitly white, not black)
            'bg-[rgba(15,17,20,0.45)] border border-[rgba(28,140,130,0.30)] text-white hover:text-white hover:border-[rgba(28,140,130,0.55)] ec-button-secondary': variant === 'secondary',
            // Ghost: no border, text only
            'border-0 bg-transparent text-ec-muted hover:text-ec-text': variant === 'ghost',
          },
          {
            'px-4 h-9 text-sm rounded-ec-md': size === 'sm',
            'px-6 h-11 text-base rounded-ec-md': size === 'md',
            'px-8 h-[54px] text-lg rounded-ec-md min-w-[320px] md:min-w-[320px]': size === 'lg',
          },
          className
        )}
        data-variant={variant}
        style={variant === 'secondary' ? { color: '#FFFFFF' } : undefined}
        ref={ref}
        {...props}
      />
    );
  }
);

EcoviraButton.displayName = 'EcoviraButton';