import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { MoneyText } from '../../components/ui/MoneyText';
import { Skeleton } from '../../components/ui/Skeleton';
import { cn, formatDate, formatCurrency } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

export default function SubscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('lines'); // 'lines' | 'invoices'
  const [violationError, setViolationError] = useState(null);
  const [copied, setCopied] = useState(false);

  // 1. Fetch Subscription
  const {
    data: subscription,
    isLoading: loadingSub,
    error: subError,
  } = useQuery({
    queryKey: ['subscription-detail', id],
    queryFn: async () => {
      const res = await api.get(`/api/subscriptions/${id}`);
      return res?.data || res;
    },
  });

  // 2. Fetch Linked Invoices
  const { data: linkedInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['subscription-invoices', id],
    queryFn: async () => {
      const res = await api.get(`/api/invoices?subscription_id=${id}`);
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: !!id,
  });

  // State Transition Mutation
  const transitionMutation = useMutation({
    mutationFn: async (targetStatus) => {
      return await api.patch(`/api/subscriptions/${id}/status`, { status: targetStatus });
    },
    onSuccess: (updated) => {
      setViolationError(null);
      queryClient.setQueryData(['subscription-detail', id], updated?.data || updated);
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      toast.success(`Contract status progressed to ${updated?.status || 'updated state'}`);
    },
    onError: (err) => {
      // Detailed inline State Machine Violation error display
      setViolationError({
        message: err.message,
        allowed: err.allowed_transitions || [],
        requested: err.requested_status,
        current: err.current_status,
      });
    },
  });

  const handleCopyId = () => {
    if (!subscription?._id) return;
    navigator.clipboard.writeText(subscription._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loadingSub) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-96" />
          <Skeleton className="lg:col-span-4 h-96" />
        </div>
      </div>
    );
  }

  if (subError || !subscription) {
    return (
      <div className="p-12 text-center space-y-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
        <p className="text-sm text-[var(--color-ink-muted)]">
          {subError?.message || 'Subscription contract could not be retrieved from the ledger.'}
        </p>
        <Button variant="secondary" onClick={() => navigate('/app/subscriptions')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Subscriptions
        </Button>
      </div>
    );
  }

  const steps = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];
  const currentStatus = subscription.status || 'Draft';
  const currentIndex = steps.indexOf(currentStatus);

  // Business state machine transition rules
  const transitionsMap = {
    Draft: ['Quotation'],
    Quotation: ['Confirmed', 'Closed'],
    Confirmed: ['Active'],
    Active: ['Closed'],
    Closed: [],
  };

  const allowedNext = transitionsMap[currentStatus] || [];
  const primaryNext = allowedNext[0]; // Next forward action

  const totalContractValue = (subscription.lines || []).reduce(
    (acc, l) => acc + (l.total_amount ?? l.quantity * l.unit_price),
    0
  );

  return (
    <div className="space-y-8 text-[var(--color-ink)]">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div className="space-y-1">
          <Link
            to="/app/subscriptions"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Contracts</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif-display text-3xl font-normal tracking-tight text-[var(--color-ink)]">
              {subscription.subscription_number || 'SUB-CONTRACT'}
            </h1>
            <StatusPill status={currentStatus} />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-ink-faint)]">
            <span>ID: {subscription._id}</span>
            <button onClick={handleCopyId} className="hover:text-[var(--color-ink)]">
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Primary Allowed State Machine Action */}
        <div className="flex items-center gap-2">
          {primaryNext && (
            <Button
              variant="primary"
              loading={transitionMutation.isPending}
              onClick={() => transitionMutation.mutate(primaryNext)}
            >
              Advance to {primaryNext}
            </Button>
          )}
          {allowedNext.includes('Closed') && currentStatus !== 'Active' && (
            <Button
              variant="secondary"
              loading={transitionMutation.isPending}
              onClick={() => transitionMutation.mutate('Closed')}
            >
              Reject / Close
            </Button>
          )}
        </div>
      </div>

      {/* State Machine Violation Error Banner */}
      {violationError && (
        <div className="p-4 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] space-y-2 text-xs text-[var(--color-accent)]">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>State Machine Violation: {violationError.message}</span>
          </div>
          {violationError.allowed && violationError.allowed.length > 0 && (
            <p className="font-mono text-[11px]">
              Permitted transitions from '{currentStatus}':{' '}
              <strong>{violationError.allowed.join(', ')}</strong>
            </p>
          )}
        </div>
      )}

      {/* Horizontal Lifecycle Stepper Timeline */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-2xs">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-ink-muted)] block mb-4">
          Lifecycle Progression
        </span>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--color-border)] z-0" />
          {steps.map((st, idx) => {
            const isCompleted = currentIndex > idx;
            const isCurrent = currentIndex === idx;
            return (
              <div key={st} className="flex flex-col items-center relative z-10 bg-[var(--color-surface)] px-2">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono transition-all',
                    isCurrent
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)] ring-4 ring-[var(--color-accent-tint)] font-bold'
                      : isCompleted
                      ? 'bg-[var(--color-ink)] text-[var(--color-canvas)] font-medium'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-faint)]'
                  )}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className={cn(
                    'text-[11px] font-mono mt-2',
                    isCurrent
                      ? 'text-[var(--color-accent)] font-semibold'
                      : isCompleted
                      ? 'text-[var(--color-ink)]'
                      : 'text-[var(--color-ink-faint)]'
                  )}
                >
                  {st}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Line Items & Billing Schedule */}
        <div className="lg:col-span-8 space-y-8">
          {/* Tabs for Contract Details vs Linked Invoices */}
          <div className="border-b border-[var(--color-border)] flex gap-6 text-xs font-mono">
            <button
              onClick={() => setActiveTab('lines')}
              className={cn(
                'pb-2.5 transition-colors border-b-2',
                activeTab === 'lines'
                  ? 'border-[var(--color-accent)] text-[var(--color-ink)] font-semibold'
                  : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              )}
            >
              Contract Lines & Pricing ({subscription.lines?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={cn(
                'pb-2.5 transition-colors border-b-2',
                activeTab === 'invoices'
                  ? 'border-[var(--color-accent)] text-[var(--color-ink)] font-semibold'
                  : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              )}
            >
              Linked Billed Invoices ({linkedInvoices.length})
            </button>
          </div>

          {activeTab === 'lines' ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 px-6 border-b border-[var(--color-border)]">
                <h3 className="font-serif-display text-base font-semibold">
                  Contract Line Schedule
                </h3>
                <p className="text-[11px] text-[var(--color-ink-muted)] font-mono">
                  Items evaluated during each recurring billing cycle
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                    <tr>
                      <th className="py-2.5 px-6">Variant / SKU</th>
                      <th className="py-2.5 px-4 text-right">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 px-4 text-right">Tax Amount</th>
                      <th className="py-2.5 px-6 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] font-num">
                    {(subscription.lines || []).map((line, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                        <td className="py-3 px-6 font-ui">
                          <span className="font-medium text-[var(--color-ink)]">
                            {line.variant_id?.variant_name || line.variant_id?.attribute_value || 'Seat License'}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--color-ink-faint)] block">
                            SKU: {line.variant_id?.sku || 'SKU-STD'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">{line.quantity}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(line.unit_price)}</td>
                        <td className="py-3 px-4 text-right text-[var(--color-ink-muted)]">
                          {formatCurrency(line.tax_amount || 0)}
                        </td>
                        <td className="py-3 px-6 text-right font-semibold text-[var(--color-ink)]">
                          {formatCurrency(line.total_amount ?? line.quantity * line.unit_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 px-6 bg-[var(--color-canvas)] border-t border-[var(--color-border)] flex justify-between items-center text-xs">
                <span className="font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                  Total Contract Valuation
                </span>
                <MoneyText amount={totalContractValue} className="font-serif-display text-lg font-bold" />
              </div>
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
              {linkedInvoices.length === 0 ? (
                <div className="p-12 text-center text-xs text-[var(--color-ink-muted)]">
                  No invoices generated yet for this subscription. Invoices generate on active billing runs.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                      <tr>
                        <th className="py-2.5 px-6">Invoice #</th>
                        <th className="py-2.5 px-4">Period</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Grand Total</th>
                        <th className="py-2.5 px-4 text-right">Amount Due</th>
                        <th className="py-2.5 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {linkedInvoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-[var(--color-surface-hover)]">
                          <td className="py-3 px-6 font-mono font-medium text-[var(--color-ink)]">
                            {inv.invoice_number}
                          </td>
                          <td className="py-3 px-4 text-[11px] font-mono text-[var(--color-ink-muted)]">
                            {formatDate(inv.billing_period_start, 'short')} – {formatDate(inv.billing_period_end, 'short')}
                          </td>
                          <td className="py-3 px-4">
                            <StatusPill status={inv.status} />
                          </td>
                          <td className="py-3 px-4 text-right font-num">
                            <MoneyText amount={inv.grand_total} />
                          </td>
                          <td className="py-3 px-4 text-right font-num font-semibold text-[var(--color-accent)]">
                            <MoneyText amount={inv.amount_due ?? inv.grand_total} />
                          </td>
                          <td className="py-3 px-6 text-right">
                            <Link
                              to={`/app/invoices/${inv._id}`}
                              className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              Inspect <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sticky Summary Rail (4 cols) */}
        <div className="lg:col-span-4 space-y-6 sticky top-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-6 shadow-2xs">
            <h3 className="font-serif-display text-base font-semibold border-b border-[var(--color-border)] pb-3">
              Contract Metadata
            </h3>

            {/* Customer Account */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
                Customer Account
              </span>
              <p className="text-xs font-semibold text-[var(--color-ink)]">
                {subscription.customer_id?.name || 'Customer'}
              </p>
              <p className="text-[11px] font-mono text-[var(--color-ink-muted)] truncate">
                {subscription.customer_id?.email || '—'}
              </p>
              {subscription.customer_id?.phone && (
                <p className="text-[11px] font-mono text-[var(--color-ink-faint)]">
                  {subscription.customer_id.phone}
                </p>
              )}
            </div>

            {/* Plan Configuration */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
                Plan Configuration
              </span>
              <p className="text-xs font-semibold text-[var(--color-ink)]">
                {subscription.plan_id?.name || 'Standard Tier'}
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--color-ink-muted)]">
                <span>Frequency: {subscription.plan_id?.billing_frequency || 'Monthly'}</span>
                <span>•</span>
                <span>Behavior: {subscription.plan_id?.renewal_behavior || 'Renew'}</span>
              </div>
            </div>

            {/* Dates & Schedule */}
            <div className="space-y-2 pt-2 border-t border-[var(--color-border)] text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-muted)]">Start Date:</span>
                <span className="font-mono">{formatDate(subscription.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-muted)]">Payment Terms:</span>
                <span className="font-mono">{subscription.payment_terms || 'Net 30'}</span>
              </div>
              {subscription.next_billing_date && (
                <div className="flex justify-between font-semibold text-[var(--color-accent)]">
                  <span>Next Billing Trigger:</span>
                  <span className="font-mono">{formatDate(subscription.next_billing_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
