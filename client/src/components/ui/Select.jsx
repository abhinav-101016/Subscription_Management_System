import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Select = React.forwardRef(
  ({ className, label, error, helperText, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-[var(--color-ink-muted)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            className={cn(
              'w-full h-9 px-3 pr-8 rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] appearance-none cursor-pointer focus:outline-none focus:border-[#0D4A38] dark:focus:border-[#15805D] focus:ring-1 focus:ring-[#0D4A38] dark:focus:ring-[#15805D] transition-colors',
              error && 'border-[#B91C1C] focus:border-[#B91C1C]',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="w-4 h-4 text-[var(--color-ink-faint)] absolute right-2.5 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-[#B91C1C]">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-[var(--color-ink-faint)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

