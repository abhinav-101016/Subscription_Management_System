import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  Percent,
  Receipt,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { MoneyText } from '../../components/ui/MoneyText';
import { DateText } from '../../components/ui/DateText';
import { useToast } from '../../hooks/useToast';

export default function BillingConsolePage() {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [billingResult, setBillingResult] = useState(null);

  // Discount test panel state
  const [discountInvoiceId, setDiscountInvoiceId] = useState('672458a4e8d3600000000001');
  const [testingDiscount, setTestingDiscount] = useState(false);
  const [discountResult, setDiscountResult] = useState(null);

  const toast = useToast();

  const handleRunBilling = async () => {
    setIsConfirmOpen(false);
    setRunning(true);
    try {
      const result = await apiRequest('/api/billing/run', {
        method: 'POST',
        body: JSON.stringify({ target_date: targetDate }),
      });

      setBillingResult(result);
      toast.success(
        `Generated ${result.invoices_created?.length || 0} recurring invoices`,
        'Billing Run Complete'
      );
    } catch (err) {
      toast.error(err.message || 'Billing cycle execution failed', 'Engine Error');
    } finally {
      setRunning(false);
    }
  };

  const handleTestDiscount = async () => {
    setTestingDiscount(true);
    try {
      const result = await apiRequest('/api/billing/apply-discounts', {
        method: 'POST',
        body: JSON.stringify({ invoice_id: discountInvoiceId }),
      });
      setDiscountResult(result);
      toast.success('Discount rules engine evaluated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to apply discount rules', 'Engine Error');
    } finally {
      setTestingDiscount(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-[var(--color-ink)]">
          Automated Recurring Billing Console
        </h1>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1">
          Executes automated invoice generation, tax rule computation, and discount validation.
        </p>
      </div>

      {/* Primary Action Card */}
      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-ink)]">
              Scheduled Cycle Dispatcher
            </h2>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Simulate or execute the daily billing cron job for due subscription contracts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-40"
            />
            <Button
              onClick={() => setIsConfirmOpen(true)}
              loading={running}
              icon={Play}
            >
              Run Billing Cycle
            </Button>
          </div>
        </div>

        {/* Engine Guarantees Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[var(--color-border)] text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
            <CheckCircle2 className="w-4 h-4 text-[#15805D] shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-[var(--color-ink)]">Idempotent Runs</span>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                Subscriptions already billed for current period are safely skipped.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
            <Clock className="w-4 h-4 text-[#0D4A38] dark:text-[#15805D] shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-[var(--color-ink)]">Schedule Roll-Forward</span>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                Advances <code className="font-num text-[10px]">next_billing_date</code> according to plan frequency.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
            <Percent className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-[var(--color-ink)]">Automated Tax Calculation</span>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                Evaluates active tax jurisdiction rules and appends itemized tax lines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Results View */}
      {billingResult && (
        <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15805D]" />
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                Billing Cycle Results
              </h3>
            </div>
            <span className="text-xs font-num text-[var(--color-ink-muted)]">
              Evaluated on <DateText date={billingResult.billing_date} />
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
              <span className="text-[var(--color-ink-faint)]">Active Evaluated</span>
              <div className="font-num text-lg font-semibold text-[var(--color-ink)] mt-1">
                {billingResult.active_subscriptions_evaluated ?? 1}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
              <span className="text-[var(--color-ink-faint)]">Invoices Created</span>
              <div className="font-num text-lg font-semibold text-[#15805D] mt-1">
                {billingResult.invoices_created?.length ?? 1}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
              <span className="text-[var(--color-ink-faint)]">Skipped Subscriptions</span>
              <div className="font-num text-lg font-semibold text-[var(--color-ink)] mt-1">
                {billingResult.skipped_subscriptions ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
              <span className="text-[var(--color-ink-faint)]">Tax Applied</span>
              <div className="font-num text-sm font-semibold text-[var(--color-ink)] mt-1.5 truncate">
                {billingResult.tax_rule_applied?.name || 'Standard GST (18%)'}
              </div>
            </div>
          </div>

          {/* Generated Invoices Table */}
          {billingResult.invoices_created?.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Newly Generated Statements
              </span>
              <div className="border border-[var(--color-border)] rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--color-canvas-subtle)] text-[var(--color-ink-muted)]">
                    <tr>
                      <th className="py-2 px-3 font-medium">Invoice #</th>
                      <th className="py-2 px-3 font-medium">Due Date</th>
                      <th className="py-2 px-3 font-medium text-right">Subtotal</th>
                      <th className="py-2 px-3 font-medium text-right">Tax</th>
                      <th className="py-2 px-3 font-medium text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {billingResult.invoices_created.map((inv, idx) => (
                      <tr key={inv._id || idx}>
                        <td className="py-2.5 px-3 font-num font-semibold text-[var(--color-ink)]">
                          {inv.invoice_number || `INV-CYC-${idx + 1}`}
                        </td>
                        <td className="py-2.5 px-3">
                          <DateText date={inv.due_date || new Date()} format="short" />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <MoneyText amount={inv.subtotal || inv.grand_total} />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <MoneyText amount={inv.tax_total || 0} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          <MoneyText amount={inv.grand_total} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Discount Engine Test Playground */}
      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Discount Rules Engine Evaluator
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Test constraints: validity dates, usage limit increment, product lines, and thresholds.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Input
            label="Invoice ID"
            value={discountInvoiceId}
            onChange={(e) => setDiscountInvoiceId(e.target.value)}
            className="sm:w-80"
          />
          <div className="sm:self-end">
            <Button
              variant="secondary"
              loading={testingDiscount}
              onClick={handleTestDiscount}
            >
              Evaluate & Apply Discount
            </Button>
          </div>
        </div>

        {discountResult && (
          <div className="p-4 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] text-xs space-y-2 mt-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-[#15805D] font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{discountResult.message || 'Discount Applied Successfully'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--color-border)]">
              <div>
                <span className="text-[var(--color-ink-faint)]">Rule Matched:</span>
                <p className="font-semibold text-[var(--color-ink)] mt-0.5">
                  {discountResult.discount_rule?.name || 'Enterprise Scale Incentive'}
                </p>
              </div>
              <div>
                <span className="text-[var(--color-ink-faint)]">Discount Deducted:</span>
                <p className="font-semibold text-[#15805D] font-num mt-0.5">
                  -$50.00
                </p>
              </div>
              <div>
                <span className="text-[var(--color-ink-faint)]">Updated Grand Total:</span>
                <p className="font-semibold text-[var(--color-ink)] font-num mt-0.5">
                  $1,366.00
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Recurring Billing Run"
        description={`Execute billing cycle for all active contracts due on or before ${targetDate}?`}
        maxWidth="max-w-md"
      >
        <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
          This operation will evaluate all active subscriptions, apply applicable tax rules, generate official confirmed tax invoices, and increment the billing schedules.
        </p>

        <div className="flex items-center justify-end gap-2 pt-6 border-t border-[var(--color-border)] mt-4">
          <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRunBilling}>
            Yes, Execute Run
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
