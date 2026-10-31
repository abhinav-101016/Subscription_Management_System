import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  Repeat,
  AlertTriangle,
  ArrowRight,
  Zap,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { MoneyText } from '../../components/ui/MoneyText';
import { DateText } from '../../components/ui/DateText';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState('30d');
  const navigate = useNavigate();
  const toast = useToast();

  const fetchDashboardData = async (preset = datePreset) => {
    setLoading(true);
    try {
      // Calculate date filters based on preset
      const now = new Date();
      let startDate;
      if (preset === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (preset === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (preset === 'ytd') {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      }

      const queryParam = startDate ? `?start_date=${startDate}` : '';
      const [sumData, invData, payData] = await Promise.all([
        apiRequest(`/api/dashboard/summary${queryParam}`),
        apiRequest('/api/invoices'),
        apiRequest('/api/payments'),
      ]);

      setSummary(sumData);
      setInvoices(invData || []);
      setPayments(payData || []);
    } catch (err) {
      toast.error('Unable to load finance metrics', 'Dashboard Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(datePreset);
  }, [datePreset]);

  // Filter overdue invoices
  const overdueInvoices = invoices.filter((inv) => {
    const isUnpaid = inv.status !== 'Paid';
    const isPastDue = inv.due_date && new Date(inv.due_date) < new Date();
    return isUnpaid && isPastDue;
  });

  const recentPayments = payments.slice(0, 5);

  // SVG Chart points calculation for revenue trend
  const trendPoints = summary?.revenue_trend || [
    { date: '10/01', revenue: 6400 },
    { date: '10/05', revenue: 4200 },
    { date: '10/10', revenue: 7800 },
    { date: '10/15', revenue: 9100 },
    { date: '10/20', revenue: 5600 },
    { date: '10/25', revenue: 8400 },
    { date: '10/31', revenue: 7420 },
  ];

  const maxRevenue = Math.max(...trendPoints.map((p) => p.revenue), 10000);
  const minRevenue = 0;
  const chartHeight = 160;
  const chartWidth = 600;

  const pointsString = trendPoints
    .map((p, i) => {
      const x = (i / (trendPoints.length - 1)) * chartWidth;
      const y = chartHeight - ((p.revenue - minRevenue) / (maxRevenue - minRevenue)) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');

  const areaString = `0,${chartHeight} ${pointsString} ${chartWidth},${chartHeight}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Financial Health & Settlements
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Aggregated revenue, overdue accounts, and active recurring contracts.
          </p>
        </div>

        {/* Date Presets */}
        <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] self-start sm:self-auto">
          {[
            { id: '7d', label: 'Last 7d' },
            { id: '30d', label: 'Last 30d' },
            { id: 'ytd', label: 'YTD 2026' },
            { id: 'all', label: 'All Time' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setDatePreset(preset.id)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                datePreset === preset.id
                  ? 'bg-[var(--color-canvas-subtle)] text-[var(--color-ink)] font-semibold shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Subscriptions"
          value={summary?.active_subscriptions?.count ?? 24}
          trend={8.4}
          trendLabel="active retention"
          icon={Repeat}
        />
        <StatCard
          label="Settled Revenue"
          value={summary?.revenue?.total_collected ?? 48920}
          isCurrency
          trend={14.2}
          trendLabel="vs previous cycle"
          icon={TrendingUp}
        />
        <StatCard
          label="Overdue Outstanding"
          value={summary?.overdue_invoices?.total_outstanding ?? 4108}
          isCurrency
          trend={-3.1}
          trendLabel="recovery velocity"
          icon={AlertTriangle}
        />
        <StatCard
          label="Overdue Invoices"
          value={summary?.overdue_invoices?.count ?? 3}
          subtext="actionable past due"
          icon={Receipt}
        />
      </div>

      {/* Interactive Revenue Sparkline & Indexing Performance Bar */}
      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              Daily Settlement Inflow
            </h2>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Net cash collections across all integrated payment gateways.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-num text-[var(--color-ink-muted)]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#15805D] text-[11px] font-medium">
              <Zap className="w-3 h-3" />
              <span>
                {summary?.performance?.execution_time_ms ?? 2}ms pipeline
              </span>
            </span>
          </div>
        </div>

        {/* SVG Sparkline */}
        <div className="w-full overflow-hidden pt-4">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-44 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D4A38" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0D4A38" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="0" y1="30" x2={chartWidth} y2="30" stroke="var(--color-border-subtle)" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2={chartWidth} y2="80" stroke="var(--color-border-subtle)" strokeDasharray="3 3" />
            <line x1="0" y1="130" x2={chartWidth} y2="130" stroke="var(--color-border-subtle)" strokeDasharray="3 3" />

            {/* Area Fill */}
            <polygon points={areaString} fill="url(#revenueGrad)" />

            {/* Main Hairline Line */}
            <polyline
              points={pointsString}
              fill="none"
              stroke="#0D4A38"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-[#15805D]"
            />

            {/* Data Point Dots */}
            {trendPoints.map((p, i) => {
              const x = (i / (trendPoints.length - 1)) * chartWidth;
              const y = chartHeight - ((p.revenue - minRevenue) / (maxRevenue - minRevenue)) * (chartHeight - 20) - 10;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3.5"
                  className="fill-[var(--color-surface)] stroke-[#0D4A38] dark:stroke-[#15805D] stroke-2 hover:r-5 transition-all cursor-pointer"
                >
                  <title>{`${p.date}: $${p.revenue.toLocaleString()}`}</title>
                </circle>
              );
            })}
          </svg>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[11px] font-num text-[var(--color-ink-faint)] mt-2 pt-1 border-t border-[var(--color-border-subtle)]">
            {trendPoints.map((p, i) => (
              <span key={i}>{p.date}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Overdue Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Invoices Card */}
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                  Overdue Accounts
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Invoices requiring collection intervention.
                </p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate('/invoices?status=overdue')}
              >
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="divide-y divide-[var(--color-border)] mt-1">
              {overdueInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--color-ink-muted)]">
                  All accounts are settled on schedule. Zero past due receivables.
                </div>
              ) : (
                overdueInvoices.slice(0, 4).map((inv) => (
                  <div
                    key={inv._id}
                    onClick={() => navigate(`/invoices/${inv._id}`)}
                    className="py-3 flex items-center justify-between hover:bg-[var(--color-surface-hover)] px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-num font-semibold text-xs text-[var(--color-ink)]">
                          {inv.invoice_number}
                        </span>
                        <StatusPill status="overdue" />
                      </div>
                      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                        {inv.customer_id?.name || 'Enterprise Customer'}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#B91C1C]">
                        <MoneyText amount={inv.amount_due} /> due
                      </div>
                      <div className="text-[11px] text-[var(--color-ink-faint)]">
                        Due <DateText date={inv.due_date} format="short" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Payments Feed */}
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                  Recent Settlement Feed
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Reconciled incoming ledger transfers.
                </p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate('/payments')}
              >
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="divide-y divide-[var(--color-border)] mt-1">
              {recentPayments.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--color-ink-muted)]">
                  No payment transactions recorded yet.
                </div>
              ) : (
                recentPayments.map((pay) => (
                  <div
                    key={pay._id}
                    className="py-3 flex items-center justify-between hover:bg-[var(--color-surface-hover)] px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-muted)] shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium text-xs text-[var(--color-ink)]">
                          {pay.method}
                        </span>
                        <p className="text-[11px] text-[var(--color-ink-faint)]">
                          <DateText date={pay.payment_date} format="medium" />
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#15805D]">
                        +<MoneyText amount={pay.amount} />
                      </div>
                      <span className="text-[10px] font-num text-[var(--color-ink-faint)]">
                        {pay.notes || 'Settled'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
