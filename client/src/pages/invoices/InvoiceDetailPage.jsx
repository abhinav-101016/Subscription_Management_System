import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Building,
} from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Stepper } from '../../components/ui/Stepper';
import { MoneyText } from '../../components/ui/MoneyText';
import { DateText } from '../../components/ui/DateText';
import { Skeleton } from '../../components/ui/Skeleton';
import { RecordPaymentDialog } from '../payments/RecordPaymentDialog';
import { truncateId } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      const [invData, allPayments] = await Promise.all([
        apiRequest(`/api/invoices/${id}`),
        apiRequest('/api/payments'),
      ]);

      setInvoice(invData);
      const linked = (allPayments || []).filter(
        (p) => p.invoice_id?._id === id || p.invoice_id === id
      );
      setPayments(linked);
    } catch (err) {
      toast.error('Failed to load invoice details', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handlePaymentSuccess = (result) => {
    // If backend returns updated invoice, update local state
    if (result?.invoice) {
      setInvoice(result.invoice);
    } else {
      fetchInvoiceData();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-[var(--color-ink-muted)]">Invoice not found.</p>
        <Button variant="secondary" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const invoiceSteps = ['Draft', 'Confirmed', 'Paid'];
  const allowedTransitions = invoice.status === 'Draft' ? ['Confirmed'] : invoice.status === 'Confirmed' ? ['Paid'] : [];

  const handleStatusAdvance = async (nextStatus) => {
    try {
      const updated = await apiRequest(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setInvoice(updated);
      toast.success(`Invoice marked as ${nextStatus}`);
    } catch (err) {
      toast.error(err.message || 'Status transition failed', 'Error');
    }
  };

  const isPaid = invoice.status === 'Paid' || (invoice.amount_due !== undefined && invoice.amount_due <= 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/invoices')}
            title="Back to invoices"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif-display text-2xl font-medium tracking-tight text-[var(--color-ink)]">
                Invoice {invoice.invoice_number}
              </h1>
              <StatusPill status={invoice.status} />
            </div>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Ref: <span className="font-num">{truncateId(invoice._id, 8, 4)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
          >
            Print Statement
          </Button>

          {!isPaid && (
            <Button
              size="sm"
              onClick={() => setIsPaymentOpen(true)}
              icon={CreditCard}
            >
              Record Payment
            </Button>
          )}

          {allowedTransitions.map((nextSt) => (
            <Button
              key={nextSt}
              variant="outline"
              size="sm"
              onClick={() => handleStatusAdvance(nextSt)}
            >
              Mark as {nextSt}
            </Button>
          ))}
        </div>
      </div>

      {/* Stepper (Hidden when printing) */}
      <div className="no-print p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
            Invoice Settlement Stepper
          </span>
          <span className="text-[var(--color-ink-muted)]">
            State: <span className="font-medium text-[var(--color-ink)]">{invoice.status}</span>
          </span>
        </div>
        <Stepper
          steps={invoiceSteps}
          currentStep={invoice.status}
          allowedTransitions={allowedTransitions}
          onTransition={handleStatusAdvance}
        />
      </div>

      {/* Printable Invoice Document */}
      <div className="printable-document p-8 md:p-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-[var(--color-border)]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0D4A38] dark:bg-[#15805D] text-white flex items-center justify-center font-serif-display text-lg font-bold">
                C
              </div>
              <span className="font-serif-display text-2xl font-medium tracking-tight text-[var(--color-ink)]">
                Cadence Finance
              </span>
            </div>
            <div className="text-xs text-[var(--color-ink-muted)] space-y-0.5 leading-relaxed">
              <p>548 Market Street, Suite 3400</p>
              <p>San Francisco, CA 94104</p>
              <p className="font-num">tax-id: US-EIN-94-2819034</p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="font-num text-xs uppercase tracking-widest text-[var(--color-ink-faint)]">
              Tax Invoice
            </div>
            <div className="font-num text-2xl font-semibold text-[var(--color-ink)]">
              {invoice.invoice_number}
            </div>
            <div className="text-xs text-[var(--color-ink-muted)] space-y-1 pt-1">
              <div>
                Date Issued: <DateText date={invoice.issue_date || invoice.createdAt} />
              </div>
              <div>
                Payment Due: <DateText date={invoice.due_date} className="font-medium text-[var(--color-ink)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Billed To / Subscription Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-[var(--color-border)] text-xs">
          <div>
            <span className="font-semibold uppercase tracking-wider text-[var(--color-ink-faint)] block mb-1">
              Billed To
            </span>
            <div className="font-medium text-sm text-[var(--color-ink)]">
              {invoice.customer_id?.name || 'Enterprise Customer'}
            </div>
            <div className="text-[var(--color-ink-muted)] mt-0.5">
              {invoice.customer_id?.email || 'accounts@enterprise.com'}
            </div>
            <div className="text-[var(--color-ink-faint)] mt-1">
              Customer Ref: {truncateId(invoice.customer_id?._id || invoice.customer_id, 8, 4)}
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="font-semibold uppercase tracking-wider text-[var(--color-ink-faint)] block mb-1">
              Recurring Contract
            </span>
            <div className="font-medium text-[var(--color-ink)]">
              Subscription #{truncateId(invoice.subscription_id?._id || invoice.subscription_id, 8, 4)}
            </div>
            <div className="text-[var(--color-ink-muted)]">
              Settlement Status: <span className="font-semibold">{invoice.status}</span>
            </div>
          </div>
        </div>

        {/* Invoice Line Items */}
        <div className="space-y-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-ink-muted)]">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Unit Price</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {(invoice.lines || [
                {
                  product_variant_id: { name: 'Platform Enterprise Subscription' },
                  quantity: 1,
                  unit_price: invoice.subtotal || invoice.grand_total,
                },
              ]).map((line, idx) => {
                const total = (line.quantity || 1) * (line.unit_price || 0);
                return (
                  <tr key={idx}>
                    <td className="py-3">
                      <div className="font-medium text-[var(--color-ink)]">
                        {line.product_variant_id?.name || 'Recurring Service Line'}
                      </div>
                      <div className="text-[11px] text-[var(--color-ink-faint)]">
                        {line.product_variant_id?.sku || `SKU-ITEM-${idx + 1}`}
                      </div>
                    </td>
                    <td className="py-3 text-right font-num">{line.quantity || 1}</td>
                    <td className="py-3 text-right">
                      <MoneyText amount={line.unit_price} />
                    </td>
                    <td className="py-3 text-right font-medium">
                      <MoneyText amount={total} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Calculation Table */}
        <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-[var(--color-ink-muted)]">
              <span>Subtotal</span>
              <MoneyText amount={invoice.subtotal || invoice.grand_total} />
            </div>

            {invoice.discount_total > 0 && (
              <div className="flex justify-between text-[#15805D]">
                <span>Discount Applied</span>
                <span className="font-num">-<MoneyText amount={invoice.discount_total} /></span>
              </div>
            )}

            {invoice.tax_total > 0 && (
              <div className="flex justify-between text-[var(--color-ink-muted)]">
                <span>
                  Tax {invoice.tax_rule_applied?.percentage_rate ? `(${invoice.tax_rule_applied.percentage_rate}%)` : ''}
                </span>
                <MoneyText amount={invoice.tax_total} />
              </div>
            )}

            <div className="flex justify-between text-sm font-semibold text-[var(--color-ink)] pt-2 border-t border-[var(--color-border)]">
              <span>Grand Total</span>
              <MoneyText amount={invoice.grand_total} />
            </div>

            <div className="flex justify-between text-xs text-[var(--color-ink-muted)]">
              <span>Amount Paid</span>
              <MoneyText amount={invoice.amount_paid || 0} />
            </div>

            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-[var(--color-border)]">
              <span className={invoice.amount_due > 0 ? 'text-[#B91C1C]' : 'text-[#15805D]'}>
                Balance Due
              </span>
              <MoneyText
                amount={invoice.amount_due ?? 0}
                className={invoice.amount_due > 0 ? 'text-[#B91C1C]' : 'text-[#15805D]'}
              />
            </div>
          </div>
        </div>

        {/* Associated Payment History Ledger */}
        <div className="pt-6 border-t border-[var(--color-border)] space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Settlement & Payment Records
          </h4>

          {payments.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)] italic">
              No payments recorded against this invoice yet.
            </p>
          ) : (
            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--color-canvas-subtle)] text-[var(--color-ink-muted)]">
                  <tr>
                    <th className="py-2 px-3 font-medium">Payment ID</th>
                    <th className="py-2 px-3 font-medium">Method</th>
                    <th className="py-2 px-3 font-medium">Date</th>
                    <th className="py-2 px-3 font-medium">Notes</th>
                    <th className="py-2 px-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {payments.map((p) => (
                    <tr key={p._id}>
                      <td className="py-2.5 px-3 font-num">{truncateId(p._id, 6, 4)}</td>
                      <td className="py-2.5 px-3 font-medium">{p.method}</td>
                      <td className="py-2.5 px-3">
                        <DateText date={p.payment_date} format="short" />
                      </td>
                      <td className="py-2.5 px-3 text-[var(--color-ink-muted)]">
                        {p.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-num font-semibold text-[#15805D]">
                        +<MoneyText amount={p.amount} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        invoice={invoice}
        onPaymentRecorded={handlePaymentSuccess}
      />
    </div>
  );
}

