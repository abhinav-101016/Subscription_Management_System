import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(
  ({ className, type = 'text', label, error, helperText, prefix, suffix, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-[var(--color-ink-muted)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-xs text-[var(--color-ink-faint)] pointer-events-none font-num">
              {prefix}
            </span>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'w-full h-9 px-3 rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[#0D4A38] dark:focus:border-[#15805D] focus:ring-1 focus:ring-[#0D4A38] dark:focus:ring-[#15805D] transition-colors',
              prefix && 'pl-7',
              suffix && 'pr-8',
              error && 'border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]',
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-xs text-[var(--color-ink-faint)] pointer-events-none font-num">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-[#B91C1C]">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-[var(--color-ink-faint)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
