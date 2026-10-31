import React from 'react';
import { Check, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Stepper({
  steps = [],
  currentStep,
  allowedTransitions = [],
  onTransition,
  disabled = false,
  className,
}) {
  const currentIndex = steps.findIndex(
    (s) => s.toLowerCase() === (currentStep || '').toLowerCase()
  );

  return (
    <div className={cn('w-full flex items-center justify-between gap-2 overflow-x-auto py-2', className)}>
      {steps.map((step, idx) => {
        const isCompleted = currentIndex !== -1 && idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isFuture = idx > currentIndex;
        const isNextAllowed = allowedTransitions.some(
          (t) => t.toLowerCase() === step.toLowerCase()
        );

        return (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={disabled || !isNextAllowed}
                onClick={() => isNextAllowed && onTransition && onTransition(step)}
                className={cn(
                  'group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                  isCompleted &&
                    'border-[#0D4A38]/30 dark:border-[#15805D]/30 bg-[#0D4A38]/5 dark:bg-[#15805D]/10 text-[#0D4A38] dark:text-[#1BA376]',
                  isCurrent &&
                    'border-[#0D4A38] dark:border-[#15805D] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs ring-1 ring-[#0D4A38] dark:ring-[#15805D]',
                  isFuture && !isNextAllowed &&
                    'border-[var(--color-border-subtle)] text-[var(--color-ink-faint)] bg-transparent cursor-default',
                  isNextAllowed &&
                    'border-dashed border-[#0D4A38] dark:border-[#15805D] text-[#0D4A38] dark:text-[#15805D] hover:bg-[var(--color-accent-tint)] cursor-pointer'
                )}
              >
                <span
                  className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-num shrink-0',
                    isCompleted && 'bg-[#0D4A38] dark:bg-[#15805D] text-white',
                    isCurrent && 'bg-[var(--color-ink)] text-[var(--color-canvas)]',
                    isFuture && !isNextAllowed && 'bg-[var(--color-border)] text-[var(--color-ink-faint)]',
                    isNextAllowed && 'bg-[#0D4A38]/10 text-[#0D4A38] dark:text-[#15805D]'
                  )}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                </span>

                <span className="capitalize">{step}</span>

                {isNextAllowed && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0D4A38] dark:text-[#15805D] opacity-75">
                    (Next)
                  </span>
                )}
              </button>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-[1px] min-w-4 transition-colors',
                  idx < currentIndex ? 'bg-[#0D4A38]/40 dark:bg-[#15805D]/40' : 'bg-[var(--color-border)]'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
