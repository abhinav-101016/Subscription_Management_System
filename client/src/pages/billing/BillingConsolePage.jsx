import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Percent,
  Receipt,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Dialog } from '../../components/ui/Dialog';
import { MoneyText } from '../../components/ui/MoneyText';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatCurrency } from '../../lib/utils';

export default function BillingConsolePage() {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [billingResult, setBillingResult] = useState(null);

  // Discount Test Panel State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [discountResult, setDiscountResult] = useState(null);
  const [discountError, setDiscountError] = useState('');

  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch real invoices for discount testing
  const { data: invoices = [] } = useQuery({
    queryKey: ['billing-invoices-picker'],
    queryFn: async () => {
      const res = await api.get('/api/invoices');
      const list = Array.isArray(res) ? res : res?.data || [];
      if (list.length > 0 && !selectedInvoiceId) {
        setSelectedInvoiceId(list[0]._id);
      }
      return list;
    },
  });

  // Run Billing Cycle Mutation
  const runMutation = useMutation({
    mutationFn: async (dateStr) => {
      return await api.post('/api/billing/run', { target_date: dateStr });
    },
    onSuccess: (res) => {
      setBillingResult(res?.data || res);
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Billing cycle executed', 'Recurring invoice generation complete');
    },
    onError: (err) => {
      toast.error(err.message || 'Billing cycle execution failed');
    },
  });

  // Test Discount Rules Mutation
  const discountMutation = useMutation({
    mutationFn: async (invId) => {
      return await api.post('/api/billing/apply-discounts', { invoice_id: invId });
    },
    onSuccess: (res) => {
      setDiscountError('');
      setDiscountResult(res?.data || res);
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      toast.success('Discount rules evaluated against invoice');
    },
    onError: (err) => {
      setDiscountError(err.message || 'Failed to apply discount rules');
      setDiscountResult(null);
    },
  });

  const handleConfirmRun = () => {
    setIsConfirmOpen(false);
    runMutation.mutate(targetDate);
  };

  const invoicesCreated = billingResult?.invoices_created || billingResult?.generated_invoices || [];
  const skippedCount = billingResult?.skipped_count ?? (billingResult?.invoices_skipped?.length || 0);
  const evaluatedCount = billingResult?.active_subscriptions_evaluated ?? billingResult?.total_due_subscriptions ?? 0;

  return (
    <div className="space-y-8 text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Automated Billing Engine
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Idempotent recurring invoice generation and automated discount rule evaluation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left (7 cols): Billing Run Execution */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-6 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border)]">
              <Zap className="w-5 h-5 text-[var(--color-accent)]" />
              <div>
                <h3 className="font-serif-display text-lg font-semibold">
                  Execute Recurring Billing Run
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Evaluates all contracts in <strong className="font-mono">Active</strong> status against the target reference date.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Billing Reference Date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />

              <div className="p-3.5 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] space-y-1.5 text-xs text-[var(--color-ink-muted)]">
                <span className="font-mono uppercase text-[10px] text-[var(--color-ink)] font-semibold block">
                  Idempotency Guarantee
                </span>
                <p className="leading-relaxed">
                  The engine will never generate duplicate invoices for a contract period that has already been billed. Re-running the same date is safe and neutral.
                </p>
              </div>

              <Button
                variant="primary"
                className="w-full"
                loading={runMutation.isPending}
                onClick={() => setIsConfirmOpen(true)}
                icon={Play}
              >
                Initiate Billing Run
              </Button>
            </div>
          </div>

          {/* Results Summary Box */}
          {billingResult && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-4 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <h4 className="font-serif-display text-base font-semibold">
                  Billing Execution Report
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold uppercase">
                  Complete
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
                  <span className="text-[10px] font-mono uppercase text-[var(--color-ink-muted)] block">
                    Contracts Evaluated
                  </span>
                  <div className="font-serif-display text-xl font-normal">{evaluatedCount}</div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
                  <span className="text-[10px] font-mono uppercase text-[var(--color-ink-muted)] block">
                    Invoices Created
                  </span>
                  <div className="font-serif-display text-xl font-normal text-[var(--color-accent)]">
                    {invoicesCreated.length}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
                  <span className="text-[10px] font-mono uppercase text-[var(--color-ink-muted)] block">
                    Idempotent Skips
                  </span>
                  <div className="font-serif-display text-xl font-normal text-[var(--color-ink-muted)]">
                    {skippedCount}
                  </div>
                </div>
              </div>

              {invoicesCreated.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-[var(--color-ink)] block">
                    Generated Invoices:
                  </span>
                  <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-lg overflow-hidden">
                    {invoicesCreated.map((inv, idx) => (
                      <div key={idx} className="p-2.5 px-3 flex items-center justify-between text-xs font-mono bg-[var(--color-surface)]">
                        <span>{inv.invoice_number || `Invoice Ref #${idx + 1}`}</span>
                        <Link
                          to={`/app/invoices/${inv._id || inv.id}`}
                          className="text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 font-sans"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right (5 cols): Automated Discount Rule Test Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-6 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border)]">
              <Percent className="w-5 h-5 text-[var(--color-accent)]" />
              <div>
                <h3 className="font-serif-display text-lg font-semibold">
                  Discount Evaluation Panel
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Simulate and apply configured discount rules against any Draft invoice.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Select
                label="Target Invoice"
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
              >
                {invoices.map((inv) => (
                  <option key={inv._id} value={inv._id}>
                    {inv.invoice_number} ({inv.status} - {formatCurrency(inv.grand_total)})
                  </option>
                ))}
              </Select>

              {discountError && (
                <div className="p-3 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] text-xs text-[var(--color-accent)]">
                  {discountError}
                </div>
              )}

              <Button
                variant="secondary"
                className="w-full"
                loading={discountMutation.isPending}
                disabled={!selectedInvoiceId}
                onClick={() => discountMutation.mutate(selectedInvoiceId)}
              >
                Evaluate & Apply Discounts
              </Button>
            </div>

            {discountResult && (
              <div className="p-4 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] space-y-2 text-xs font-mono">
                <span className="font-semibold text-[var(--color-ink)] block uppercase text-[10px]">
                  Discount Evaluation Result
                </span>
                <div className="flex justify-between">
                  <span>Deduction Total:</span>
                  <MoneyText amount={discountResult.discount_total || 0} className="font-bold text-emerald-700 dark:text-emerald-400" />
                </div>
                <div className="flex justify-between">
                  <span>Recalculated Grand Total:</span>
                  <MoneyText amount={discountResult.grand_total} className="font-bold" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Automated Billing Run"
        description={`Are you sure you want to trigger the billing cycle for reference date ${formatDate(targetDate)}?`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
            All active recurring subscriptions due on or before this date will have Draft invoices generated. Idempotency guarantees prevent duplicate billings.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmRun}>
              Confirm Run
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
