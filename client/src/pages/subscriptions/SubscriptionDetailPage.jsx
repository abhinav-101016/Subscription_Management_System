import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Play,
  FileText,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Stepper } from '../../components/ui/Stepper';
import { MoneyText } from '../../components/ui/MoneyText';
import { DateText } from '../../components/ui/DateText';
import { Skeleton } from '../../components/ui/Skeleton';
import { truncateId } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

export default function SubscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [violationError, setViolationError] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    setViolationError(null);
    try {
      const [subData, allInvoices] = await Promise.all([
        apiRequest(`/api/subscriptions/${id}`),
        apiRequest('/api/invoices'),
      ]);

      setSubscription(subData);
      // Filter invoices linked to this subscription
      const linked = (allInvoices || []).filter(
        (inv) => inv.subscription_id?._id === id || inv.subscription_id === id
      );
      setInvoices(linked);
    } catch (err) {
      toast.error('Failed to load subscription details', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Transition status using state machine PATCH endpoint
  const handleTransition = async (nextStatus) => {
    setTransitioning(true);
    setViolationError(null);
    try {
      const updated = await apiRequest(`/api/subscriptions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setSubscription(updated);
      toast.success(`Subscription transitioned to ${nextStatus}`, 'State Updated');
    } catch (err) {
      // Check for structured state machine violation
      if (err.isStateMachineViolation || err.serverData?.error === 'State Machine Violation') {
        setViolationError({
          current_status: err.current_status || subscription.status,
          requested_status: err.requested_status || nextStatus,
          allowed_transitions: err.allowed_transitions || [],
          message: err.message,
        });
      } else {
        toast.error(err.message || 'Status transition failed', 'Error');
      }
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-[var(--color-ink-muted)]">Subscription record not found.</p>
        <Button variant="secondary" onClick={() => navigate('/subscriptions')}>
          Back to Subscriptions
        </Button>
      </div>
    );
  }

  const steps = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

  // State-machine allowed transitions mapping
  const allowedTransitionsMap = {
    Draft: ['Quotation'],
    Quotation: ['Confirmed', 'Closed'],
    Confirmed: ['Active'],
    Active: ['Closed'],
    Closed: [],
  };

  const allowedNext = allowedTransitionsMap[subscription.status] || [];
  const lines = subscription.lines || [];
  const cycleSubtotal = lines.reduce(
    (acc, l) => acc + (l.quantity || 1) * (l.unit_price || 0),
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation & ID Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/subscriptions')}
            title="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif-display text-2xl font-medium tracking-tight text-[var(--color-ink)]">
                Subscription {truncateId(subscription._id, 8, 4)}
              </h1>
              <StatusPill status={subscription.status} />
            </div>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Created on <DateText date={subscription.createdAt || subscription.start_date} />
            </p>
          </div>
        </div>

        {/* Transition Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {allowedNext.map((targetStatus) => {
            const isDanger = targetStatus === 'Closed';
            return (
              <Button
                key={targetStatus}
                variant={isDanger ? 'danger' : 'primary'}
                size="sm"
                loading={transitioning}
                onClick={() => handleTransition(targetStatus)}
              >
                {targetStatus === 'Quotation' && 'Submit Quotation'}
                {targetStatus === 'Confirmed' && 'Accept & Confirm'}
                {targetStatus === 'Active' && 'Activate Contract'}
                {targetStatus === 'Closed' && 'Close / Terminate'}
              </Button>
            );
          })}

          {allowedNext.length === 0 && (
            <span className="text-xs font-num text-[var(--color-ink-faint)] italic">
              Terminal state reached
            </span>
          )}
        </div>
      </div>

      {/* State Machine Violation Error Banner */}
      {violationError && (
        <div className="p-4 rounded-xl border border-[#B91C1C]/40 bg-rose-500/10 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>State Machine Violation</span>
          </div>
          <p className="text-[var(--color-ink)]">
            Illegal transition from <span className="font-semibold">{violationError.current_status}</span> to{' '}
            <span className="font-semibold">{violationError.requested_status}</span>.
          </p>
          {violationError.allowed_transitions.length > 0 ? (
            <p className="text-[var(--color-ink-muted)]">
              Allowed transitions from current state:{' '}
              <span className="font-medium text-[var(--color-ink)]">
                {violationError.allowed_transitions.join(', ')}
              </span>
            </p>
          ) : (
            <p className="text-[var(--color-ink-muted)]">
              This contract is in a terminal state and cannot transition further.
            </p>
          )}
        </div>
      )}

      {/* Stepper Card */}
      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
            Lifecycle State Machine
          </span>
          <span className="text-xs text-[var(--color-ink-muted)]">
            Current status:{' '}
            <span className="font-medium text-[var(--color-ink)] capitalize">
              {subscription.status}
            </span>
          </span>
        </div>

        <Stepper
          steps={steps}
          currentStep={subscription.status}
          allowedTransitions={allowedNext}
          onTransition={handleTransition}
          disabled={transitioning}
        />
      </div>

      {/* Metadata Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Account */}
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink-muted)] uppercase">
            <User className="w-3.5 h-3.5" />
            <span>Customer Account</span>
          </div>
          <div>
            <div className="font-medium text-sm text-[var(--color-ink)]">
              {subscription.customer_id?.name || 'Enterprise Customer'}
            </div>
            <div className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              {subscription.customer_id?.email || '—'}
            </div>
            <div className="text-xs text-[var(--color-ink-faint)] font-num mt-1">
              ID: {truncateId(subscription.customer_id?._id || subscription.customer_id, 10, 6)}
            </div>
          </div>
        </div>

        {/* Plan Configuration */}
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink-muted)] uppercase">
            <Calendar className="w-3.5 h-3.5" />
            <span>Plan Configuration</span>
          </div>
          <div>
            <div className="font-medium text-sm text-[var(--color-ink)]">
              {subscription.plan_id?.name || 'Standard Recurring Plan'}
            </div>
            <div className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Frequency: {subscription.plan_id?.billing_frequency || 'Monthly'}
            </div>
            <div className="text-xs text-[var(--color-ink-faint)] font-num mt-1">
              Renewal: {subscription.plan_id?.renewal_behavior || 'Renew'}
            </div>
          </div>
        </div>

        {/* Billing Schedule */}
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink-muted)] uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>Billing Cycle</span>
          </div>
          <div>
            <div className="flex justify-between text-xs text-[var(--color-ink-muted)]">
              <span>Next Billing Date:</span>
              <DateText date={subscription.next_billing_date} className="font-semibold text-[var(--color-ink)]" />
            </div>
            <div className="flex justify-between text-xs text-[var(--color-ink-muted)] mt-1.5">
              <span>Contract Started:</span>
              <DateText date={subscription.start_date} />
            </div>
            <div className="flex justify-between text-xs text-[var(--color-ink-muted)] mt-1.5">
              <span>Cycle Value:</span>
              <MoneyText amount={cycleSubtotal} className="font-semibold text-[var(--color-ink)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Contract Line Items Table */}
      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          Contract Line Items
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-ink-muted)] bg-[var(--color-canvas-subtle)]/50">
                <th className="py-2.5 px-3 font-medium">Product Line / SKU</th>
                <th className="py-2.5 px-3 font-medium text-right">Quantity</th>
                <th className="py-2.5 px-3 font-medium text-right">Unit Price</th>
                <th className="py-2.5 px-3 font-medium text-right">Extended Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {lines.map((line, idx) => {
                const total = (line.quantity || 1) * (line.unit_price || 0);
                return (
                  <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                    <td className="py-3 px-3">
                      <div className="font-medium text-[var(--color-ink)]">
                        {line.product_variant_id?.name || 'Enterprise Service Tier'}
                      </div>
                      <div className="text-[11px] text-[var(--color-ink-faint)] font-num">
                        {line.product_variant_id?.sku || `SKU-ITEM-${idx + 1}`}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-num">
                      {line.quantity || 1}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <MoneyText amount={line.unit_price || 0} />
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">
                      <MoneyText amount={total} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--color-border)] bg-[var(--color-canvas-subtle)]/30 font-semibold text-xs">
                <td colSpan={3} className="py-3 px-3 text-right">
                  Cycle Subtotal:
                </td>
                <td className="py-3 px-3 text-right font-num text-sm text-[var(--color-ink)]">
                  <MoneyText amount={cycleSubtotal} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Linked Invoices Section */}
      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Associated Invoices
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Historical billing statements generated for this subscription.
            </p>
          </div>

          {subscription.status === 'Active' && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => navigate('/billing-console')}
              icon={RefreshCw}
            >
              Billing Engine Console
            </Button>
          )}
        </div>

        {invoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--color-ink-muted)] border border-dashed border-[var(--color-border)] rounded-lg">
            No invoices have been billed against this subscription yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-lg overflow-hidden">
            {invoices.map((inv) => (
              <div
                key={inv._id}
                onClick={() => navigate(`/invoices/${inv._id}`)}
                className="p-3.5 flex items-center justify-between hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-num font-semibold text-xs text-[var(--color-ink)]">
                        {inv.invoice_number}
                      </span>
                      <StatusPill status={inv.status} />
                    </div>
                    <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">
                      Issued <DateText date={inv.issue_date || inv.createdAt} /> • Due{' '}
                      <DateText date={inv.due_date} />
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-[var(--color-ink)]">
                    <MoneyText amount={inv.grand_total} />
                  </div>
                  {inv.amount_due > 0 ? (
                    <div className="text-[11px] font-medium text-[#B91C1C]">
                      <MoneyText amount={inv.amount_due} /> due
                    </div>
                  ) : (
                    <div className="text-[11px] font-medium text-[#15805D]">
                      Fully Paid
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

