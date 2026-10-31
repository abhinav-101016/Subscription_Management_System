import { clsx } from 'clsx';

/**
 * Combines class names safely
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Format currency with tabular numerals
 * Defaults to USD or INR based on locale/settings
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
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
 * Truncate long ObjectIDs or hashes
 */
export function truncateId(id, prefixLen = 6, suffixLen = 4) {
  if (!id) return '';
  const str = String(id);
  if (str.length <= prefixLen + suffixLen) return str;
  return `${str.slice(0, prefixLen)}…${str.slice(-suffixLen)}`;
}

