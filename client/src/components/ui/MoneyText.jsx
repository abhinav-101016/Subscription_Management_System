import React from 'react';
import { formatCurrency, cn } from '../../lib/utils';

export function MoneyText({ amount, currency = 'USD', className, showSign = false }) {
  const numeric = Number(amount) || 0;
  const formatted = formatCurrency(Math.abs(numeric), currency);
  const sign = numeric > 0 ? '+' : numeric < 0 ? '-' : '';

  return (
    <span className={cn('font-num tabular-nums tracking-tight font-medium', className)}>
      {showSign && numeric !== 0 && sign}
      {formatted}
    </span>
  );
}
