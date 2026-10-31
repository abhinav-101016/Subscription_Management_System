import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { MoneyText } from '../../components/ui/MoneyText';
import { Skeleton } from '../../components/ui/Skeleton';
import { RecordPaymentDialog } from '../payments/RecordPaymentDialog';
import { cn, formatDate, formatCurrency } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../features/auth/AuthContext';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // 1. Fetch Invoice
  const {
    data: invoice,
    isLoading: loadingInvoice,
    error: invoiceError,
  } = useQuery({
    queryKey: ['invoice-detail', id],
    queryFn: async () => {
      const res = await api.get(`/api/invoices/${id}`);
      return res?.data || res;
    },
  });

  // 2. Fetch Payment History for this invoice
  const { data: payments = [] } = useQuery({
    queryKey: ['invoice-payments', id],
    queryFn: async () => {
      const res = await api.get(`/api/invoices/${id}/payments`);
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: !!id,
  });

  // Status progression mutation (Draft -> Confirmed)
  const statusMutation = useMutation({
    mutationFn: async (nextStatus) => {
      return await api.patch(`/api/invoices/${id}/status`, { status: nextStatus });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['invoice-detail', id], updated?.data || updated);
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      toast.success(`Invoice marked as ${updated?.status || 'Confirmed'}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update invoice status');
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const backPath = role === 'customer' ? '/app/portal/invoices' : '/app/invoices';

  if (loadingInvoice) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  if (invoiceError || !invoice) {
    return (
      <div className="p-12 text-center space-y-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl max-w-xl mx-auto">
        <p className="text-sm text-[var(--color-ink-muted)]">
          {invoiceError?.message || 'Invoice record could not be found.'}
        </p>
        <Button variant="secondary" onClick={() => navigate(backPath)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Invoices
        </Button>
      </div>
    );
  }

  const isPaid = invoice.status === 'Paid' || (invoice.amount_due !== undefined && invoice.amount_due <= 0);
  const isOverdue = !isPaid && invoice.due_date && new Date(invoice.due_date) < new Date();
  const amountDue = invoice.amount_due !== undefined ? Number(invoice.amount_due) : Number(invoice.grand_total);

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-[var(--color-ink)]">
      {/* Sticky Action Bar (Hidden on Print) */}
      <div className="no-print sticky top-4 z-20 bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>

        <div className="flex items-center gap-3">
          {invoice.status === 'Draft' && role !== 'customer' && (
            <Button
              variant="secondary"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate('Confirmed')}
            >
              Confirm Invoice
            </Button>
          )}

          {invoice.status === 'Confirmed' && amountDue > 0 && (
            <Button
              variant="primary"
              onClick={() => setIsPaymentOpen(true)}
              icon={CreditCard}
            >
              Record Payment Settlement
            </Button>
          )}

          <Button variant="ghost" onClick={handlePrint} icon={Printer}>
            Print / Download PDF
          </Button>
        </div>
      </div>

      {/* The Paper Document (Centered on Desk Background) */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 sm:p-12 shadow-sm space-y-8 relative overflow-hidden">
        {/* Subtle Stamp Watermark */}
        {isPaid ? (
          <div className="stamp-paid absolute right-12 top-28 px-4 py-1.5 text-sm rounded font-mono">
            SETTLED IN FULL
          </div>
        ) : isOverdue ? (
          <div className="stamp-overdue absolute right-12 top-28 px-4 py-1.5 text-sm rounded font-mono">
            PAST DUE ARREARS
          </div>
        ) : null}

        {/* Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[var(--color-ink)] text-[var(--color-canvas)] flex items-center justify-center font-serif text-base font-bold">
                C
              </div>
              <span className="font-serif-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                Cadence
              </span>
            </div>
            <p className="text-[11px] font-mono text-[var(--color-ink-muted)] mt-1 uppercase tracking-wider">
              Recurring Financial Statement & Tax Invoice
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 font-mono">
            <span className="text-xs uppercase text-[var(--color-ink-muted)] block">Invoice Number</span>
            <div className="text-base font-bold text-[var(--color-ink)]">{invoice.invoice_number}</div>
            <div className="text-[11px] text-[var(--color-ink-faint)]">
              Issued: {formatDate(invoice.createdAt || invoice.billing_period_start)}
            </div>
          </div>
        </div>

        {/* Billed To & Contract Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
              Billed To Customer
            </span>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {invoice.customer_id?.name || 'Customer Account'}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] font-mono">
              {invoice.customer_id?.email || '—'}
            </p>
            {invoice.customer_id?.phone && (
              <p className="text-[11px] text-[var(--color-ink-faint)] font-mono">
                {invoice.customer_id.phone}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:text-right font-mono text-xs">
            <div className="flex justify-between sm:justify-end gap-4">
              <span className="text-[var(--color-ink-muted)]">Billing Cycle:</span>
              <span>
                {formatDate(invoice.billing_period_start, 'short')} – {formatDate(invoice.billing_period_end, 'short')}
              </span>
            </div>
            <div className="flex justify-between sm:justify-end gap-4">
              <span className="text-[var(--color-ink-muted)]">Due Date:</span>
              <span className="font-semibold text-[var(--color-accent)]">
                {formatDate(invoice.due_date || invoice.billing_period_end, 'short')}
              </span>
            </div>
            <div className="flex justify-between sm:justify-end gap-4">
              <span className="text-[var(--color-ink-muted)]">Linked Contract:</span>
              <span className="text-[var(--color-ink)]">
                {invoice.subscription_id?.subscription_number || 'Contract Ref'}
              </span>
            </div>
          </div>
        </div>

        {/* Ruled Line Items Table */}
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
              <tr>
                <th className="py-2.5 px-6">Service / Product Item</th>
                <th className="py-2.5 px-4 text-right">Quantity</th>
                <th className="py-2.5 px-4 text-right">Unit Price</th>
                <th className="py-2.5 px-6 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] font-num">
              {(invoice.lines || []).map((line, idx) => (
                <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="py-3 px-6 font-ui">
                    <span className="font-medium text-[var(--color-ink)]">
                      {line.variant_id?.variant_name || line.variant_id?.attribute_value || 'Seat Subscription'}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-ink-faint)] block">
                      SKU: {line.variant_id?.sku || 'SKU-RECUR'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">{line.quantity}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(line.unit_price)}</td>
                  <td className="py-3 px-6 text-right font-semibold text-[var(--color-ink)]">
                    {formatCurrency(line.total ?? line.quantity * line.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Block */}
        <div className="flex justify-end pt-4">
          <div className="w-full sm:w-80 space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-ink-muted)]">Subtotal Amount:</span>
              <span className="font-num">{formatCurrency(invoice.subtotal_amount || invoice.grand_total)}</span>
            </div>

            {invoice.discount_total > 0 && (
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)] text-emerald-700 dark:text-emerald-400">
                <span>Discount Deduction:</span>
                <span className="font-num">-{formatCurrency(invoice.discount_total)}</span>
              </div>
            )}

            {invoice.tax_total > 0 && (
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-ink-muted)]">Statutory Tax:</span>
                <span className="font-num">+{formatCurrency(invoice.tax_total)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b border-[var(--color-border)] font-semibold text-sm">
              <span className="font-serif-display text-base">Grand Total:</span>
              <span className="font-num">{formatCurrency(invoice.grand_total)}</span>
            </div>

            <div className="flex justify-between py-1 text-[var(--color-ink-muted)]">
              <span>Amount Settled / Paid:</span>
              <span className="font-num">{formatCurrency(invoice.amount_paid || 0)}</span>
            </div>

            <div className="flex justify-between py-2 pt-3 font-bold text-base text-[var(--color-accent)] border-t border-[var(--color-border)]">
              <span className="font-serif-display text-lg">Balance Due:</span>
              <span className="font-num text-xl">{formatCurrency(amountDue)}</span>
            </div>
          </div>
        </div>

        {/* Reconciliation Settlement Timeline */}
        <div className="pt-8 border-t border-[var(--color-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif-display text-base font-semibold">
              Payment Settlement Ledger ({payments.length})
            </h4>
            {invoice.status === 'Confirmed' && amountDue > 0 && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setIsPaymentOpen(true)}
                icon={CreditCard}
              >
                Record Payment
              </Button>
            )}
          </div>

          {payments.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)] italic">
              No payments have been posted against this invoice.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-lg overflow-hidden">
              {payments.map((p) => (
                <div key={p._id} className="p-3 px-4 flex items-center justify-between text-xs font-mono bg-[var(--color-canvas)]">
                  <div>
                    <span className="font-semibold text-[var(--color-ink)]">{p.method}</span>
                    <span className="text-[10px] text-[var(--color-ink-faint)] block">
                      Posted: {formatDate(p.payment_date || p.createdAt)} • Ref: {p._id.slice(-8)}
                    </span>
                    {p.notes && <p className="text-[11px] text-[var(--color-ink-muted)] italic mt-0.5">{p.notes}</p>}
                  </div>
                  <MoneyText amount={p.amount} className="font-bold text-emerald-700 dark:text-emerald-400 font-num text-sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        invoice={invoice}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['invoice-payments', id] });
          queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
          queryClient.invalidateQueries({ queryKey: ['payments-list'] });
          setIsPaymentOpen(false);
        }}
      />
    </div>
  );
}
