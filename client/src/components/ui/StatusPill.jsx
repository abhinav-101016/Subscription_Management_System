import React from 'react';
import { cn } from '../../lib/utils';

export function StatusPill({ status, className }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  const styles = {
    // Subscription States
    draft: 'bg-[var(--color-canvas-subtle)] text-[var(--color-ink-muted)] border-[var(--color-border)]',
    quotation: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    confirmed: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
    active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    closed: 'bg-[var(--color-canvas-subtle)] text-[var(--color-ink-faint)] border-[var(--color-border-subtle)]',

    // Invoice States
    paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    overdue: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',

    // General / Rules
    true: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    false: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
    percentage: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    fixed: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  };

  const matchedStyle =
    styles[normalized] ||
    'bg-[var(--color-canvas-subtle)] text-[var(--color-ink-muted)] border-[var(--color-border)]';

  // Dot color
  const dotStyles = {
    active: 'bg-emerald-500',
    paid: 'bg-emerald-500',
    quotation: 'bg-amber-500',
    confirmed: 'bg-sky-500',
    overdue: 'bg-rose-500',
    closed: 'bg-[var(--color-ink-faint)]',
    draft: 'bg-[var(--color-ink-faint)]',
  };

  const dot = dotStyles[normalized];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border tracking-tight select-none',
        matchedStyle,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />}
      <span>{status}</span>
    </span>
  );
}

export const Badge = StatusPill;
