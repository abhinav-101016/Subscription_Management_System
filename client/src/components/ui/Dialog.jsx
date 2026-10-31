import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Dialog Window */}
      <div
        className={cn(
          'relative w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150',
          maxWidth,
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-[var(--color-ink)] leading-snug">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] p-1 rounded-md hover:bg-[var(--color-canvas-subtle)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
