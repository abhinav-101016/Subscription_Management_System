import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Receipt,
  Layers,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { MoneyText } from '../../components/ui/MoneyText';
import { Skeleton } from '../../components/ui/Skeleton';
import { RecordPaymentDialog } from '../payments/RecordPaymentDialog';
import { useAuth } from '../../features/auth/AuthContext';
import { formatDate, formatCurrency } from '../../lib/utils';

export default function CustomerPortalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPayOpen, setIsPayOpen] = useState(false);

  // 1. Fetch Customer's Subscriptions
  const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['portal-subscriptions', user?._id],
    queryFn: async () => {
      const res = await api.get('/api/subscriptions');
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // 2. Fetch Customer's Invoices
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['portal-invoices', user?._id],
    queryFn: async () => {
      const res = await api.get('/api/invoices');
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const unpaidInvoices = invoices.filter(
    (inv) => inv.status !== 'Paid' && (inv.amount_due === undefined || Number(inv.amount_due) > 0)
  );

  const totalOutstanding = unpaidInvoices.reduce(
    (acc, curr) => acc + Number(curr.amount_due ?? curr.grand_total),
    0
  );

  const handlePayNow = (inv) => {
    setSelectedInvoice(inv);
    setIsPayOpen(true);
  };

  return (
    <div className="space-y-8 text-[var(--color-ink)] max-w-6xl mx-auto">
      {/* Customer Header */}
      <div className="pb-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-ink-muted)] block">
            Client Portal Account
          </span>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Welcome, {user?.name || user?.email || 'Valued Client'}
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Overview of your active contracts, billed statements, and payment reconciliation.
          </p>
        </div>

        {totalOutstanding > 0 && unpaidInvoices.length > 0 && (
          <div className="p-3 px-5 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-accent)] block font-semibold">
                Total Balance Due
              </span>
              <MoneyText amount={totalOutstanding} className="font-serif-display text-xl font-bold text-[var(--color-accent)]" />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePayNow(unpaidInvoices[0])}
              icon={CreditCard}
            >
              Pay Outstanding
            </Button>
          </div>
        )}
      </div>

      {/* Ruled Single Container Strip */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 shadow-2xs">
        <div className="p-6 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-ink-muted)] block">
            Active Subscriptions
          </span>
          <div className="font-serif-display text-3xl font-normal">
            {subscriptions.filter((s) => s.status === 'Active').length}
          </div>
          <span className="text-[11px] text-[var(--color-ink-faint)] block">
            Contracts currently delivering service
          </span>
        </div>

        <div className="p-6 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-ink-muted)] block">
            Unpaid Invoices
          </span>
          <div className="font-serif-display text-3xl font-normal text-[var(--color-accent)]">
            {unpaidInvoices.length}
          </div>
          <span className="text-[11px] text-[var(--color-ink-faint)] block">
            Statements pending settlement
          </span>
        </div>

        <div className="p-6 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-ink-muted)] block">
            Total Invoiced to Date
          </span>
          <div className="font-serif-display text-3xl font-normal">
            <MoneyText amount={invoices.reduce((acc, curr) => acc + Number(curr.grand_total || 0), 0)} />
          </div>
          <span className="text-[11px] text-[var(--color-ink-faint)] block">
            Cumulative billing across all periods
          </span>
        </div>
      </div>

      {/* Active Subscriptions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
          <h3 className="font-serif-display text-xl font-semibold">
            My Subscriptions
          </h3>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
          {loadingSubs ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-mono">
              Loading active contracts...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--color-ink-muted)]">
              No subscription contracts linked to your customer profile.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                  <tr>
                    <th className="py-2.5 px-6">Contract Number</th>
                    <th className="py-2.5 px-4">Plan</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Billing Cycle</th>
                    <th className="py-2.5 px-6 text-right">Items Bundled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {subscriptions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-[var(--color-surface-hover)]">
                      <td className="py-3 px-6 font-mono font-semibold text-[var(--color-ink)]">
                        {sub.subscription_number}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[var(--color-ink)] block">
                          {sub.plan_id?.name || 'Standard Tier'}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                          {sub.plan_id?.billing_frequency || 'Monthly'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill status={sub.status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--color-ink-muted)]">
                        From {formatDate(sub.start_date, 'short')}
                      </td>
                      <td className="py-3 px-6 text-right font-num">
                        {sub.lines?.length || 1} line item(s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
          <h3 className="font-serif-display text-xl font-semibold">
            Billed Invoices & Statements
          </h3>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
          {loadingInvoices ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-mono">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--color-ink-muted)]">
              No invoices generated yet for your account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                  <tr>
                    <th className="py-2.5 px-6">Invoice Number</th>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Grand Total</th>
                    <th className="py-2.5 px-4 text-right">Amount Due</th>
                    <th className="py-2.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] font-num">
                  {invoices.map((inv) => {
                    const due = inv.amount_due !== undefined ? Number(inv.amount_due) : Number(inv.grand_total);
                    return (
                      <tr key={inv._id} className="hover:bg-[var(--color-surface-hover)]">
                        <td className="py-3 px-6 font-semibold text-[var(--color-ink)]">
                          <Link
                            to={`/app/portal/invoices/${inv._id}`}
                            className="hover:text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                          >
                            {inv.invoice_number} <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>

                        <td className="py-3 px-4 font-ui text-[11px] font-mono text-[var(--color-ink-muted)]">
                          {formatDate(inv.billing_period_start, 'short')} – {formatDate(inv.billing_period_end, 'short')}
                        </td>

                        <td className="py-3 px-4">
                          <StatusPill status={inv.status} />
                        </td>

                        <td className="py-3 px-4 text-right text-[var(--color-ink)]">
                          <MoneyText amount={inv.grand_total} />
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-[var(--color-accent)]">
                          <MoneyText amount={due} />
                        </td>

                        <td className="py-3 px-6 text-right font-ui">
                          {due > 0 && inv.status === 'Confirmed' ? (
                            <Button variant="primary" size="xs" onClick={() => handlePayNow(inv)}>
                              Pay Now
                            </Button>
                          ) : (
                            <Link
                              to={`/app/portal/invoices/${inv._id}`}
                              className="text-xs text-[var(--color-accent)] hover:underline font-medium"
                            >
                              View Statement
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Dialog */}
      {selectedInvoice && (
        <RecordPaymentDialog
          open={isPayOpen}
          onClose={() => setIsPayOpen(false)}
          invoice={selectedInvoice}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
            queryClient.invalidateQueries({ queryKey: ['portal-subscriptions'] });
          }}
        />
      )}
    </div>
  );
}
