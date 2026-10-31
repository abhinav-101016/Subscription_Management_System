import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Search, Check, Copy, ExternalLink } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { MoneyText } from '../../components/ui/MoneyText';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { cn, formatDate } from '../../lib/utils';
import { useAuth } from '../../features/auth/AuthContext';

export default function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedId, setCopiedId] = useState(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const invoiceIdFilter = searchParams.get('invoice_id') || '';
  const searchQuery = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 15;

  // 1. Fetch Payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments-list', invoiceIdFilter],
    queryFn: async () => {
      const q = invoiceIdFilter ? `?invoice_id=${invoiceIdFilter}` : '';
      const res = await api.get(`/api/payments${q}`);
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // 2. Fetch Invoices for recording payment
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-options'],
    queryFn: async () => {
      const res = await api.get('/api/invoices');
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const handleCopy = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenRecord = () => {
    // Default to invoice filter or first confirmed invoice with amount due
    const unpaid = invoices.find((i) => i.status === 'Confirmed' && (i.amount_due > 0 || i.amount_due === undefined));
    setSelectedInvoice(unpaid || invoices[0] || null);
    setIsRecordOpen(true);
  };

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase();
      const invNum = p.invoice_id?.invoice_number || '';
      const method = p.method || '';
      const notes = p.notes || '';
      return !q || invNum.toLowerCase().includes(q) || method.toLowerCase().includes(q) || notes.toLowerCase().includes(q);
    });
  }, [payments, searchQuery]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Payment Reconciliation Ledger
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Real cash inflows, partial settlements, and verified ledger postings.
          </p>
        </div>

        {role !== 'customer' && (
          <Button variant="primary" onClick={handleOpenRecord} icon={Plus}>
            Record Payment
          </Button>
        )}
      </div>

      {/* Invoice Filter Badge if filtered by invoice */}
      {invoiceIdFilter && (
        <div className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between text-xs">
          <span className="font-mono text-[var(--color-ink-muted)]">
            Filtered by Invoice ID: <strong className="text-[var(--color-ink)]">{invoiceIdFilter}</strong>
          </span>
          <button
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.delete('invoice_id');
              setSearchParams(p);
            }}
            className="text-[var(--color-accent)] font-semibold hover:underline"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="w-3.5 h-3.5 text-[var(--color-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            if (e.target.value) p.set('q', e.target.value);
            else p.delete('q');
            p.set('page', '1');
            setSearchParams(p);
          }}
          placeholder="Search by invoice #, method, or note..."
          className="w-full pl-9 pr-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] placeholder-[var(--color-ink-faint)] focus:outline-hidden focus:border-[var(--color-accent)]"
        />
      </div>

      {/* Ruled Dense Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-mono">
            Loading payments ledger...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-muted)]">
            No payment settlements found in this ledger query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                <tr>
                  <th className="py-2.5 px-6">Invoice #</th>
                  <th className="py-2.5 px-4">Settlement Date</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Reference Notes</th>
                  <th className="py-2.5 px-6 text-right">Amount Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] font-num">
                {paginated.map((pay) => (
                  <tr key={pay._id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-3 px-6">
                      <div className="font-semibold text-[var(--color-ink)]">
                        {pay.invoice_id?.invoice_number ? (
                          <Link
                            to={`/app/invoices/${pay.invoice_id._id || pay.invoice_id}`}
                            className="hover:text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 font-mono"
                          >
                            {pay.invoice_id.invoice_number} <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="font-mono text-[var(--color-ink-muted)]">Settlement Ref</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-ink-faint)] font-mono">
                        <span>{pay._id.slice(-8)}</span>
                        <button onClick={(e) => handleCopy(pay._id, e)} className="hover:text-[var(--color-ink)]">
                          {copiedId === pay._id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[var(--color-ink)] font-mono">
                      {formatDate(pay.payment_date || pay.createdAt, 'short')}
                    </td>

                    <td className="py-3 px-4 font-ui">
                      <span className="font-medium text-[var(--color-ink)]">{pay.method}</span>
                    </td>

                    <td className="py-3 px-4 font-ui text-[var(--color-ink-muted)] truncate max-w-[200px]">
                      {pay.notes || '—'}
                    </td>

                    <td className="py-3 px-6 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      <MoneyText amount={pay.amount} />
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
              Page {page} of {totalPages} ({filtered.length} total payments)
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

      {/* Record Payment Dialog */}
      {selectedInvoice && (
        <RecordPaymentDialog
          open={isRecordOpen}
          onClose={() => setIsRecordOpen(false)}
          invoice={selectedInvoice}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['payments-list'] });
            queryClient.invalidateQueries({ queryKey: ['invoices-options'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          }}
        />
      )}
    </div>
  );
}
