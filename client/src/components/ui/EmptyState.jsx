import React from 'react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]/50',
        className
      )}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-muted)] mb-3">
          <Icon className="w-5 h-5 stroke-[1.5]" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
      {description && (
        <p className="text-xs text-[var(--color-ink-muted)] max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
