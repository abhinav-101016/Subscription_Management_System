import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { formatCurrency, cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatCard({
  label,
  value,
  isCurrency = false,
  trend,
  trendLabel = 'vs last month',
  subtext,
  icon: Icon,
  className,
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const animatedValue = useCountUp(numericValue);

  const displayValue = isCurrency
    ? formatCurrency(animatedValue)
    : Math.round(animatedValue).toLocaleString();

  const isPositiveTrend = trend > 0;
  const isNegativeTrend = trend < 0;

  return (
    <div
      className={cn(
        'p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between transition-all hover:border-[var(--color-ink-faint)]/40',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-muted)]">
          {label}
        </span>
        {Icon && (
          <div className="w-7 h-7 rounded-md bg-[var(--color-canvas-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-ink-muted)]">
            <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="font-num text-3xl font-medium tracking-tight text-[var(--color-ink)]">
          {displayValue}
        </div>

        {(trend !== undefined || subtext) && (
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            {trend !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-num font-medium text-[11px]',
                  isPositiveTrend && 'text-[#15805D] bg-emerald-500/10',
                  isNegativeTrend && 'text-[#B91C1C] bg-rose-500/10',
                  trend === 0 && 'text-[var(--color-ink-muted)] bg-[var(--color-canvas-subtle)]'
                )}
              >
                {isPositiveTrend && <ArrowUpRight className="w-3 h-3" />}
                {isNegativeTrend && <ArrowDownRight className="w-3 h-3" />}
                {isPositiveTrend ? `+${trend}%` : `${trend}%`}
              </span>
            )}
            <span className="text-[var(--color-ink-faint)] truncate">
              {subtext || trendLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

