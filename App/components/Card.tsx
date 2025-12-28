import { HTMLAttributes } from 'react';
import { cn } from '../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-ec-surface border border-ec-border rounded-ec-lg shadow-ec-1 p-6',
        className
      )}
      {...props}
    />
  );
}