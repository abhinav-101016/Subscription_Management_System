import {
  LayoutDashboard,
  Layers,
  Receipt,
  CreditCard,
  Zap,
  FileText,
  Copy,
  Percent,
  ShieldCheck,
  Users,
} from 'lucide-react';

export const ROUTE_CONFIG = [
  // Admin & Staff Navigation
  {
    path: '/app/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'staff'],
    inNav: true,
    description: 'Executive revenue, active contracts, and overdue invoice metrics',
  },
  {
    path: '/app/subscriptions',
    label: 'Subscriptions',
    icon: Layers,
    roles: ['admin', 'staff'],
    inNav: true,
    description: 'Recurring contract lifecycle and state machine management',
  },
  {
    path: '/app/invoices',
    label: 'Invoices',
    icon: Receipt,
    roles: ['admin', 'staff'],
    inNav: true,
    description: 'Billed cycles, payment states, and PDF statement generation',
  },
  {
    path: '/app/payments',
    label: 'Payments',
    icon: CreditCard,
    roles: ['admin', 'staff'],
    inNav: true,
    description: 'Cash reconciliation ledger and partial settlement logging',
  },
  {
    path: '/app/billing',
    label: 'Billing Console',
    icon: Zap,
    roles: ['admin', 'staff'],
    inNav: true,
    description: 'Idempotent automated recurring billing cycle execution',
  },
  {
    path: '/app/plans',
    label: 'Plans',
    icon: FileText,
    roles: ['admin', 'staff'],
    inNav: true,
    description: 'Plan frequency, minimum quantity, and renewal behavior rules',
  },
  {
    path: '/app/templates',
    label: 'Quotation Templates',
    icon: Copy,
    roles: ['admin', 'staff'],
    inNav: true,
    description: 'Standard product bundles and pre-configured contract terms',
  },
  {
    path: '/app/discounts',
    label: 'Discounts',
    icon: Percent,
    roles: ['admin'],
    inNav: true,
    description: 'Promotional percentage and fixed value deduction rules',
  },
  {
    path: '/app/taxes',
    label: 'Tax Rules',
    icon: ShieldCheck,
    roles: ['admin'],
    inNav: true,
    description: 'Statutory VAT and GST calculation percentages',
  },
  {
    path: '/app/staff',
    label: 'Staff Governance',
    icon: Users,
    roles: ['admin'],
    inNav: true,
    description: 'Internal operator accounts and departmental access rights',
  },

  // Customer Portal Navigation
  {
    path: '/app/portal',
    label: 'Customer Overview',
    icon: LayoutDashboard,
    roles: ['customer'],
    inNav: true,
    description: 'Personal active subscriptions and upcoming renewals',
  },
  {
    path: '/app/portal/invoices',
    label: 'My Invoices',
    icon: Receipt,
    roles: ['customer'],
    inNav: true,
    description: 'Past invoices, amounts due, and payment receipts',
  },
  {
    path: '/app/portal/payments',
    label: 'Payment History',
    icon: CreditCard,
    roles: ['customer'],
    inNav: true,
    description: 'Historical payment settlements and transaction records',
  },
];

/**
 * Get permitted navigation links for a given role
 */
export function getNavItemsForRole(role) {
  const activeRole = role || 'customer';
  return ROUTE_CONFIG.filter((route) => route.inNav && route.roles.includes(activeRole));
}

/**
 * Returns the default home path for a given role
 */
export function getDefaultPathForRole(role) {
  if (role === 'admin' || role === 'staff') {
    return '/app/dashboard';
  }
  return '/app/portal';
}

