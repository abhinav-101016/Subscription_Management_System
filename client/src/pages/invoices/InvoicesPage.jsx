import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Copy, Check, ExternalLink, Printer } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { StatusPill } from '../../components/ui/StatusPill';
import { MoneyText } from '../../components/ui/MoneyText';
import { cn, formatDate } from '../../lib/utils';
import { useAuth } from '../../features/auth/AuthContext';

export default function InvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();
  const { role } = useAuth();

  const tab = searchParams.get('tab') || 'all'; // 'all' | 'outstanding' | 'paid'
  const searchQuery = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 15;

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices-list', tab],
    queryFn: async () => {
      const endpoint = tab === 'outstanding' ? '/api/invoices/outstanding' : '/api/invoices';
      const res = await api.get(endpoint);
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const setTab = (newTab) => {
    const p = new URLSearchParams(searchParams);
    p.set('tab', newTab);
    p.set('page', '1');
    setSearchParams(p);
  };

  const handleSearchChange = (val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set('q', val);
    else p.delete('q');
    p.set('page', '1');
    setSearchParams(p);
  };

  const handleCopy = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (tab === 'paid' && inv.status !== 'Paid') return false;

      const q = searchQuery.toLowerCase();
      const num = inv.invoice_number || '';
      const cust = inv.customer_id?.name || inv.customer_id?.email || '';
      const subNum = inv.subscription_id?.subscription_number || '';

      return !q || num.toLowerCase().includes(q) || cust.toLowerCase().includes(q) || subNum.toLowerCase().includes(q);
    });
  }, [invoices, tab, searchQuery]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getDetailLink = (id) => {
    return role === 'customer' ? `/app/portal/invoices/${id}` : `/app/invoices/${id}`;
  };

  return (
    <div className="space-y-6 text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Invoices & Billing Statements
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Billed cycle statements, balances due, and settlement progression.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-xs">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'outstanding', label: 'Outstanding / Overdue' },
            { id: 'paid', label: 'Paid & Settled' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 py-1 rounded text-xs font-mono font-medium transition-colors',
                tab === t.id
                  ? 'bg-[var(--color-ink)] text-[var(--color-canvas)] shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--color-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search invoice #, customer..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] placeholder-[var(--color-ink-faint)] focus:outline-hidden focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-mono">
            Loading statements ledger...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-muted)]">
            No invoices found in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                <tr>
                  <th className="py-2.5 px-6">Invoice Number</th>
                  <th className="py-2.5 px-4">Customer Account</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Period / Due Date</th>
                  <th className="py-2.5 px-4 text-right">Grand Total</th>
                  <th className="py-2.5 px-4 text-right">Amount Due</th>
                  <th className="py-2.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] font-num">
                {paginated.map((inv) => (
                  <tr
                    key={inv._id}
                    onClick={() => navigate(getDetailLink(inv._id))}
                    className="hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-6">
                      <div className="font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                        {inv.invoice_number}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-ink-faint)] font-mono">
                        <span>{inv._id.slice(-8)}</span>
                        <button onClick={(e) => handleCopy(inv._id, e)} className="hover:text-[var(--color-ink)]">
                          {copiedId === inv._id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-ui">
                      <span className="font-medium text-[var(--color-ink)] block truncate max-w-[150px]">
                        {inv.customer_id?.name || 'Customer Account'}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--color-ink-faint)] block truncate max-w-[150px]">
                        {inv.customer_id?.email || '—'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <StatusPill status={inv.status} />
                    </td>

                    <td className="py-3 px-4 text-[11px] font-mono text-[var(--color-ink-muted)] font-ui">
                      <div>Due: {formatDate(inv.due_date || inv.billing_period_end, 'short')}</div>
                      <span className="text-[10px] text-[var(--color-ink-faint)] font-mono">
                        Cycle: {formatDate(inv.billing_period_start, 'short')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-[var(--color-ink)]">
                      <MoneyText amount={inv.grand_total} />
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-[var(--color-accent)]">
                      <MoneyText amount={inv.amount_due ?? inv.grand_total} />
                    </td>

                    <td className="py-3 px-6 text-right font-ui">
                      <span className="text-xs text-[var(--color-accent)] group-hover:underline font-medium inline-flex items-center gap-1">
                        View <ExternalLink className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3 px-6 border-t border-[var(--color-border)] bg-[var(--color-canvas)] flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
            <span>
              Page {page} of {totalPages} ({filtered.length} total invoices)
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(page - 1));
                  setSearchParams(p);
                }}
                className="px-2.5 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(page + 1));
                  setSearchParams(p);
                }}
                className="px-2.5 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
