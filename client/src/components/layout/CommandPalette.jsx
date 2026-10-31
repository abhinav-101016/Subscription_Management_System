import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Repeat,
  Receipt,
  CreditCard,
  Sliders,
  CalendarDays,
  FileSpreadsheet,
  Percent,
  ShieldCheck,
  Users,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Dialog } from '../ui/Dialog';

export function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const items = [
    { title: 'Dashboard', category: 'Navigation', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Subscriptions', category: 'Navigation', icon: Repeat, path: '/subscriptions' },
    { title: 'Invoices', category: 'Navigation', icon: Receipt, path: '/invoices' },
    { title: 'Payments', category: 'Navigation', icon: CreditCard, path: '/payments' },
    { title: 'Billing Console', category: 'Navigation', icon: Sliders, path: '/billing-console' },
    { title: 'Plans & Pricing', category: 'Navigation', icon: CalendarDays, path: '/plans' },
    { title: 'Quotation Templates', category: 'Navigation', icon: FileSpreadsheet, path: '/templates' },
    { title: 'Discount Rules', category: 'Navigation', icon: Percent, path: '/discounts' },
    { title: 'Tax Rules', category: 'Navigation', icon: ShieldCheck, path: '/taxes' },
    { title: 'Staff Governance', category: 'Navigation', icon: Users, path: '/staff' },
    { title: 'Customer Portal', category: 'Navigation', icon: ShieldCheck, path: '/portal' },
    { title: 'Public Landing Page', category: 'Navigation', icon: ArrowRight, path: '/' },

    // Quick Actions
    { title: 'New Subscription', category: 'Quick Action', icon: Plus, path: '/subscriptions' },
    { title: 'Record Manual Payment', category: 'Quick Action', icon: Plus, path: '/payments' },
    { title: 'Run Automated Billing Day', category: 'Quick Action', icon: Sliders, path: '/billing-console' },
    { title: 'Create Discount Rule', category: 'Quick Action', icon: Plus, path: '/discounts' },
  ];

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item) => {
    onClose();
    navigate(item.path);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-xl" className="p-0 overflow-hidden">
      <div className="flex items-center px-4 border-b border-[var(--color-border)]">
        <Search className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0 mr-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command, page, or action..."
          autoFocus
          className="w-full h-12 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
        />
        <kbd className="font-num text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] text-[var(--color-ink-faint)]">
          ESC
        </kbd>
      </div>

      <div className="max-h-80 overflow-y-auto p-2 space-y-1">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--color-ink-muted)]">
            No matching commands or pages found.
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={`${item.title}-${idx}`}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs hover:bg-[var(--color-surface-hover)] text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]" />
                  <span className="font-medium text-[var(--color-ink)]">{item.title}</span>
                </div>
                <span className="text-[10px] font-num text-[var(--color-ink-faint)] group-hover:text-[var(--color-ink-muted)]">
                  {item.category}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Dialog>
  );
}
