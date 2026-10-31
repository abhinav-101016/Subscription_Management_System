import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { useAuth } from '../../features/auth/AuthContext';
import { getNavItemsForRole } from '../../routes/routeConfig';
import { api } from '../../lib/apiClient';

export function CommandPalette({ isOpen, open, onClose }) {
  const isDialogActive = isOpen !== undefined ? isOpen : open;
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();

  useEffect(() => {
    if (isDialogActive) {
      setQuery('');
      setSearchResults([]);
    }
  }, [isDialogActive]);

  const navItems = getNavItemsForRole(role).map((item) => ({
    title: item.label,
    description: item.description,
    category: 'Navigation',
    icon: item.icon,
    path: item.path,
  }));

  // Quick Actions appropriate for role
  const quickActions =
    role === 'customer'
      ? [
          { title: 'View Outstanding Invoices', category: 'Action', icon: ArrowRight, path: '/app/portal/invoices' },
          { title: 'Review Payment Ledger', category: 'Action', icon: ArrowRight, path: '/app/portal/payments' },
        ]
      : [
          { title: 'Configure New Plan', category: 'Action', icon: Plus, path: '/app/plans' },
          { title: 'Create Contract from Template', category: 'Action', icon: Plus, path: '/app/templates' },
          { title: 'Execute Billing Run', category: 'Action', icon: ArrowRight, path: '/app/billing' },
          { title: 'Record Payment Settlement', category: 'Action', icon: Plus, path: '/app/payments' },
        ];

  // Debounced search on Subscriptions & Invoices
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const cleanQ = query.trim().toUpperCase();
        const results = [];

        if (role !== 'customer') {
          // Search subscriptions
          const subs = await api.get('/api/subscriptions');
          const matchedSubs = (Array.isArray(subs) ? subs : [])
            .filter((s) => s.subscription_number?.toUpperCase().includes(cleanQ))
            .slice(0, 3)
            .map((s) => ({
              title: s.subscription_number,
              description: `Subscription (${s.status}) - ${s.customer_id?.name || 'Customer'}`,
              category: 'Subscription Contract',
              icon: ArrowRight,
              path: `/app/subscriptions/${s._id}`,
            }));
          results.push(...matchedSubs);
        }

        // Search invoices
        const invs = await api.get('/api/invoices');
        const matchedInvs = (Array.isArray(invs) ? invs : [])
          .filter((i) => i.invoice_number?.toUpperCase().includes(cleanQ))
          .slice(0, 3)
          .map((i) => ({
            title: i.invoice_number,
            description: `Invoice (${i.status}) - Due: ${i.amount_due ?? i.grand_total}`,
            category: 'Invoice Document',
            icon: ArrowRight,
            path: role === 'customer' ? `/app/portal/invoices/${i._id}` : `/app/invoices/${i._id}`,
          }));
        results.push(...matchedInvs);

        setSearchResults(results);
      } catch (err) {
        console.warn('Command search error:', err.message);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, role]);

  const allFilteredNav = [...navItems, ...quickActions].filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const displayItems = searchResults.length > 0 ? searchResults : allFilteredNav;

  const handleSelect = (item) => {
    onClose();
    navigate(item.path);
  };

  return (
    <Dialog open={isDialogActive} onClose={onClose} maxWidth="max-w-xl" className="p-0 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <Search className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type an invoice #, subscription #, or command..."
          className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-faint)] focus:outline-hidden"
          autoFocus
        />
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-ink-muted)]">
          ESC
        </kbd>
      </div>

      <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[var(--color-border)]/40">
        {searching && (
          <div className="p-3 text-xs text-[var(--color-ink-muted)] font-mono text-center">
            Querying ledger records...
          </div>
        )}

        {displayItems.length === 0 && !searching && (
          <div className="p-6 text-center text-xs text-[var(--color-ink-muted)]">
            No matching ledger contracts, invoices, or commands found for "{query}".
          </div>
        )}

        {displayItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={`${item.path}-${idx}`}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-[var(--color-surface-hover)] text-left group transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded bg-[var(--color-canvas-subtle)] text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)] group-hover:bg-[var(--color-accent-tint)] transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-[var(--color-ink)] block truncate">
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="text-[10px] text-[var(--color-ink-muted)] block truncate font-mono">
                      {item.description}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)] px-1.5 py-0.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)] shrink-0 ml-2">
                {item.category}
              </span>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
