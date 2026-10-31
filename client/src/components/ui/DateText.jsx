import React from 'react';
import { formatDate, cn } from '../../lib/utils';

export function DateText({ date, format = 'medium', className }) {
  return (
    <span className={cn('font-num tabular-nums text-[var(--color-ink-muted)]', className)}>
      {formatDate(date, format)}
    </span>
  );
}

