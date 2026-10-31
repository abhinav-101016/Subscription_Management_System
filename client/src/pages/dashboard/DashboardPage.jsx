import React, { useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  Layers,
  ArrowRight,
  Zap,
  CreditCard,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { MoneyText } from '../../components/ui/MoneyText';
import { DateText } from '../../components/ui/DateText';
import { Skeleton } from '../../components/ui/Skeleton';
import { cn, formatCurrency, formatDate } from '../../lib/utils';

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rangePreset = searchParams.get('range') || '30d';

  // Compute honest ISO dates from preset
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start = null;
    let end = null;

    if (rangePreset === '7d') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (rangePreset === '30d') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (rangePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (rangePreset === 'ytd') {
      start = new Date(now.getFullYear(), 0, 1).toISOString();
    } else if (rangePreset === 'all') {
      start = null;
    }
    return { startDate: start, endDate: end };
  }, [rangePreset]);

  const setRange = (preset) => {
    const params = new URLSearchParams(searchParams);
    params.set('range', preset);
    setSearchParams(params);
  };

  // 1. Fetch Summary
  const {
    data: summary,
    isLoading: loadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['dashboard-summary', startDate, endDate],
    queryFn: async () => {
      const q = startDate ? `?start_date=${encodeURIComponent(startDate)}` : '';
      return await api.get(`/api/dashboard/summary${q}`);
    },
  });

  // 2. Fetch Outstanding Invoices (Top 5)
  const { data: outstandingInvoices = [] } = useQuery({
    queryKey: ['outstanding-invoices'],
    queryFn: async () => {
      const res = await api.get('/api/invoices/outstanding');
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.slice(0, 5);
    },
  });

  // 3. Fetch Recent Payments (Top 8)
  const { data: recentPaymentsRes = [] } = useQuery({
    queryKey: ['recent-payments', startDate, endDate],
    queryFn: async () => {
      const q = startDate ? `?start_date=${encodeURIComponent(startDate)}&limit=8` : '?limit=8';
      const res = await api.get(`/api/payments${q}`);
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // 4. Fetch Active Subscriptions to determine Next Billing Run
  const { data: activeSubs = [] } = useQuery({
    queryKey: ['active-subscriptions'],
    queryFn: async () => {
      const res = await api.get('/api/subscriptions?status=Active');
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // Determine earliest next billing date honestly from active subscriptions
  const nextBillingDate = useMemo(() => {
    if (!activeSubs || activeSubs.length === 0) return null;
    const dates = activeSubs
      .map((s) => s.next_billing_date)
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((t) => !isNaN(t) && t >= Date.now());

    if (dates.length === 0) return null;
    return new Date(Math.min(...dates));
  }, [activeSubs]);

  // Daily Settlement Inflow aggregation for the selected range
  const chartPoints = useMemo(() => {
    if (!recentPaymentsRes || recentPaymentsRes.length === 0) return [];

    const grouped = {};
    for (const p of recentPaymentsRes) {
      if (!p.payment_date) continue;
      const day = p.payment_date.slice(0, 10);
      grouped[day] = (grouped[day] || 0) + Number(p.amount || 0);
    }

    const sortedDays = Object.keys(grouped).sort();
    return sortedDays.map((day) => ({
      date: day,
      amount: grouped[day],
    }));
  }, [recentPaymentsRes]);

  const maxChartAmount = useMemo(() => {
    if (chartPoints.length === 0) return 1;
    return Math.max(...chartPoints.map((p) => p.amount));
  }, [chartPoints]);

  return (
    <div className="space-y-8 text-[var(--color-ink)]">
      {/* Headline & Range Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Financial Ledger Summary
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Aggregated metrics across subscriptions, invoices, and payment settlements.
          </p>
        </div>

        {/* Range Segmented Control */}
        <div className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-xs">
          {[
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: 'this_month', label: 'This Month' },
            { id: 'ytd', label: 'YTD' },
            { id: 'all', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRange(tab.id)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors',
                rangePreset === tab.id
                  ? 'bg-[var(--color-ink)] text-[var(--color-canvas)] shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State with Retry */}
      {summaryError && (
        <div className="p-4 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] flex items-center justify-between text-xs text-[var(--color-accent)]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load summary aggregation: {summaryError.message}</span>
          </div>
          <Button variant="secondary" size="xs" onClick={() => refetchSummary()}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* The Ledger Strip (Ruled single container, no boxed card soup) */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 shadow-2xs">
        {/* KPI 1: Active Subscriptions */}
        <div className="p-6 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-ink-muted)] block">
            Active Contracts
          </span>
          {loadingSummary ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <div className="font-serif-display text-3xl font-normal text-[var(--color-ink)]">
              {summary?.active_subscriptions?.count ?? 0}
            </div>
          )}
          <span className="text-[11px] text-[var(--color-ink-faint)] block">
            Contracts currently in Active billing state
          </span>
        </div>

        {/* KPI 2: Total Revenue Collected */}
        <div className="p-6 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-ink-muted)] block">
            Collected Revenue
          </span>
          {loadingSummary ? (
            <Skeleton className="h-9 w-36" />
          ) : (
            <div className="font-serif-display text-3xl font-normal text-[var(--color-ink)]">
              <MoneyText amount={summary?.revenue?.total_collected ?? 0} />
            </div>
          )}
          <span className="text-[11px] text-[var(--color-ink-faint)] block font-mono">
            {summary?.revenue?.payments_count ?? 0} reconciled payments in period
          </span>
        </div>

        {/* KPI 3: Overdue Invoices Count */}
        <div className="p-6 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-ink-muted)] block">
            Overdue Invoices
          </span>
          {loadingSummary ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <div className="font-serif-display text-3xl font-normal text-[var(--color-accent)]">
              {summary?.overdue_invoices?.count ?? 0}
            </div>
          )}
          <span className="text-[11px] text-[var(--color-ink-faint)] block">
            Invoices unpaid past billing period end
          </span>
        </div>

        {/* KPI 4: Total Outstanding Amount */}
        <div className="p-6 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-ink-muted)] block">
            Outstanding Arrears
          </span>
          {loadingSummary ? (
            <Skeleton className="h-9 w-36" />
          ) : (
            <div className="font-serif-display text-3xl font-normal text-[var(--color-accent)]">
              <MoneyText amount={summary?.overdue_invoices?.total_amount ?? 0} />
            </div>
          )}
          <span className="text-[11px] text-[var(--color-ink-faint)] block">
            Uncollected balance past due date
          </span>
        </div>
      </div>

      {/* Asymmetric 8 / 4 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Real Inflow Chart & Top Overdue Table */}
        <div className="lg:col-span-8 space-y-8">
          {/* Daily Settlement Inflow Chart */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <h3 className="font-serif-display text-base font-semibold">
                  Daily Settlement Inflow
                </h3>
                <p className="text-[11px] text-[var(--color-ink-muted)] font-mono">
                  Honest cash receipts grouped by payment date in selected window
                </p>
              </div>
              <span className="text-[11px] font-mono text-[var(--color-ink-faint)] uppercase">
                {rangePreset.toUpperCase()}
              </span>
            </div>

            {chartPoints.length < 2 ? (
              <div className="h-48 border border-dashed border-[var(--color-border)] rounded-lg flex flex-col items-center justify-center p-6 text-center space-y-2 bg-[var(--color-canvas)]/30">
                <CreditCard className="w-5 h-5 text-[var(--color-ink-faint)]" />
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Fewer than 2 settlement dates recorded in this time range.
                </p>
                <span className="text-[10px] text-[var(--color-ink-faint)] font-mono">
                  Real payment records will render a daily inflow curve.
                </span>
              </div>
            ) : (
              <div className="h-48 pt-4 flex items-end gap-2 px-2">
                {chartPoints.map((pt, idx) => {
                  const heightPercent = Math.max(8, Math.round((pt.amount / maxChartAmount) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded bg-[var(--color-ink)] text-[var(--color-canvas)] text-[10px] font-mono whitespace-nowrap pointer-events-none z-10 shadow-xs">
                        {pt.date}: {formatCurrency(pt.amount)}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t bg-[var(--color-accent)] opacity-85 group-hover:opacity-100 transition-all"
                      />
                      <span className="text-[9px] font-mono text-[var(--color-ink-faint)] truncate max-w-[40px]">
                        {pt.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overdue Invoices Table (Top 5 Outstanding) */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 px-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h3 className="font-serif-display text-base font-semibold">
                  Overdue Accounts Receivable
                </h3>
                <p className="text-[11px] text-[var(--color-ink-muted)] font-mono">
                  Invoices requiring immediate settlement collection
                </p>
              </div>
              <Link to="/app/invoices?status=Confirmed" className="text-xs text-[var(--color-accent)] hover:underline font-medium">
                View all invoices →
              </Link>
            </div>

            {outstandingInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-ink-muted)]">
                No overdue invoices currently pending settlement. All accounts in good standing.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                    <tr>
                      <th className="py-2.5 px-6">Invoice #</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Due Date</th>
                      <th className="py-2.5 px-4 text-right">Balance Due</th>
                      <th className="py-2.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {outstandingInvoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                        <td className="py-3 px-6 font-mono font-medium text-[var(--color-ink)]">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3 px-4 truncate max-w-[140px]">
                          {inv.customer_id?.name || inv.customer_id?.email || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[var(--color-ink-muted)]">
                          {formatDate(inv.due_date || inv.billing_period_end, 'short')}
                        </td>
                        <td className="py-3 px-4 text-right font-num font-semibold text-[var(--color-accent)]">
                          <MoneyText amount={inv.amount_due ?? inv.grand_total} />
                        </td>
                        <td className="py-3 px-6 text-right">
                          <Link
                            to={`/app/invoices/${inv._id}`}
                            className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:underline"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Next Billing Run & Recent Payments Feed */}
        <div className="lg:col-span-4 space-y-8">
          {/* Next Billing Run Panel */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-[var(--color-ink)] pb-3 border-b border-[var(--color-border)]">
              <Clock className="w-4 h-4 text-[var(--color-accent)]" />
              <h3 className="font-serif-display text-base font-semibold">
                Next Billing Run
              </h3>
            </div>

            {nextBillingDate ? (
              <div className="space-y-2">
                <div className="font-serif-display text-2xl text-[var(--color-ink)]">
                  {formatDate(nextBillingDate)}
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  Derived from active contract schedules. Automated recurring invoices will be evaluated on this date.
                </p>
                <div className="pt-2">
                  <Link to="/app/billing">
                    <Button variant="secondary" size="xs" className="w-full">
                      Open Billing Console
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-[var(--color-ink-muted)]">
                <p>No active contracts have an upcoming billing trigger scheduled.</p>
                <div className="pt-2">
                  <Link to="/app/subscriptions">
                    <Button variant="secondary" size="xs" className="w-full">
                      Review Contracts
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recent Payments Feed */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="font-serif-display text-base font-semibold">
                Reconciliation Feed
              </h3>
              <Link to="/app/payments" className="text-xs text-[var(--color-accent)] hover:underline">
                Ledger →
              </Link>
            </div>

            {recentPaymentsRes.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--color-ink-muted)]">
                No payment settlements recorded in this period.
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {recentPaymentsRes.slice(0, 6).map((pay) => (
                  <div key={pay._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-mono font-medium truncate text-[var(--color-ink)]">
                        {pay.invoice_id?.invoice_number || 'Settlement'}
                      </div>
                      <span className="text-[10px] text-[var(--color-ink-faint)] font-mono">
                        {formatDate(pay.payment_date, 'short')} • {pay.method}
                      </span>
                    </div>
                    <MoneyText amount={pay.amount} className="font-semibold shrink-0 text-emerald-700 dark:text-emerald-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
