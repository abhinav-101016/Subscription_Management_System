import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      icon: Icon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all select-none focus-visible:outline-hidden disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] duration-150 cursor-pointer';

    const variants = {
      primary:
        'bg-[var(--color-accent)] text-[var(--color-accent-text)] hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] shadow-2xs',
      secondary:
        'bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border)] shadow-2xs',
      ghost:
        'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]',
      danger:
        'bg-[#B91C1C] text-white hover:bg-[#991B1B]',
      outline:
        'border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]',
      accentSubtle:
        'bg-[var(--color-accent-tint)] text-[var(--color-accent)] hover:opacity-90 border border-[var(--color-accent-border)]',
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-xs rounded-md gap-1.5',
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-9 px-4 text-xs rounded-md gap-2',
      lg: 'h-10 px-5 text-sm rounded-lg gap-2.5',
      icon: 'h-8 w-8 p-0 rounded-md',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : Icon ? (
          <Icon className="w-3.5 h-3.5 shrink-0" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
