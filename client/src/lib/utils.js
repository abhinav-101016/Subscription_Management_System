import { clsx } from 'clsx';

/**
 * Combines class names safely
 */
export function cn(...inputs) {
  return clsx(inputs);
}

const DEFAULT_CURRENCY = import.meta.env.VITE_CURRENCY || 'INR';
const DEFAULT_LOCALE = import.meta.env.VITE_LOCALE || 'en-IN';

/**
 * Format currency with tabular numerals across the entire application
 * Consistent: no mixing $ and ₹
 */
export function formatCurrency(amount, currency = DEFAULT_CURRENCY, locale = DEFAULT_LOCALE) {
  const numeric = Number(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Format date in clean editorial style
 */
export function formatDate(dateInput, formatStyle = 'medium') {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  if (formatStyle === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  }

  if (formatStyle === 'iso') {
    return date.toISOString().slice(0, 10);
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats relative time
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  const now = new Date();
  const diffDays = Math.round((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date, 'short');
}
