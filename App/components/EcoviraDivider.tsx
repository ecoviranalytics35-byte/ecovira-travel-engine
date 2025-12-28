import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

interface EcoviraDividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const EcoviraDivider = forwardRef<HTMLDivElement, EcoviraDividerProps>(
  ({ orientation = 'horizontal', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-ec-teal-border',
          {
            'h-px w-full': orientation === 'horizontal',
            'w-px h-full': orientation === 'vertical',
          },
          className
        )}
        {...props}
      />
    );
  }
);

EcoviraDivider.displayName = 'EcoviraDivider';