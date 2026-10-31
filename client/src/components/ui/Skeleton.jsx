import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--color-canvas-subtle)] border border-[var(--color-border-subtle)]',
        className
      )}
      {...props}
    />
  );
}
