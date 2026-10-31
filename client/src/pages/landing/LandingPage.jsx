import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Receipt,
  Repeat,
  Lock,
  Zap,
  Percent,
  Sliders,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { MoneyText } from '../../components/ui/MoneyText';
import { StatusPill } from '../../components/ui/StatusPill';
import { MOCK_PLANS } from '../../lib/mocks';
import { useAuth } from '../../features/auth/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)] selection:bg-[#0D4A38]/20">
      {/* Top Editorial Navbar */}
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0D4A38] dark:bg-[#15805D] text-white flex items-center justify-center font-serif-display text-lg font-bold">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-serif-display text-lg font-semibold tracking-tight text-[var(--color-ink)] leading-none">
                Cadence
              </span>
              <span className="text-[10px] text-[var(--color-ink-faint)] tracking-wider uppercase mt-0.5">
                Financial Operations
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-[var(--color-ink-muted)]">
            <a href="#features" className="hover:text-[var(--color-ink)] transition-colors">
              Platform Architecture
            </a>
            <a href="#lifecycle" className="hover:text-[var(--color-ink)] transition-colors">
              State Machine
            </a>
            <a href="#pricing" className="hover:text-[var(--color-ink)] transition-colors">
              Contract Plans
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/dashboard')}
              icon={ArrowRight}
            >
              Launch Console
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-ink-muted)]">
          <span className="w-2 h-2 rounded-full bg-[#15805D] animate-pulse" />
          <span>Cadence 2.0 Recurring Billing & Financial State Engine</span>
        </div>

        <h1 className="font-serif-display text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-[var(--color-ink)] leading-[1.08]">
          The quiet financial instrument for recurring enterprise contracts.
        </h1>

        <p className="text-base sm:text-lg text-[var(--color-ink-muted)] max-w-2xl mx-auto font-ui font-normal leading-relaxed">
          Enforce state-machine contracts, execute sub-millisecond aggregation runs, and reconcile multi-method receivable payments with mathematical precision.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 h-11 text-sm"
          >
            Enter Operational Console
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/portal')}
            className="w-full sm:w-auto px-6 h-11 text-sm"
          >
            Customer Self-Service
          </Button>
        </div>
      </section>

      {/* Crafted Interactive App Preview Mockup */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
          {/* Mockup Window Chrome */}
          <div className="h-10 px-4 bg-[var(--color-canvas-subtle)] border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-3 font-num text-[11px] text-[var(--color-ink-faint)]">
                cadence://production/dashboard/summary
              </span>
            </div>
            <span className="text-[10px] font-num px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[#15805D]">
              ● 2ms Index Optimized
            </span>
          </div>

          {/* Mock Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <span className="text-[11px] font-medium text-[var(--color-ink-faint)] uppercase">
                  Active Contracts
                </span>
                <div className="font-num text-2xl font-semibold text-[var(--color-ink)] mt-1">
                  24
                </div>
                <span className="text-[11px] text-[#15805D] mt-0.5 block">
                  +8.4% retention
                </span>
              </div>

              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <span className="text-[11px] font-medium text-[var(--color-ink-faint)] uppercase">
                  Net Collections
                </span>
                <div className="font-num text-2xl font-semibold text-[var(--color-ink)] mt-1">
                  $48,920.00
                </div>
                <span className="text-[11px] text-[#15805D] mt-0.5 block">
                  100% reconciled
                </span>
              </div>

              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <span className="text-[11px] font-medium text-[var(--color-ink-faint)] uppercase">
                  Overdue Accounts
                </span>
                <div className="font-num text-2xl font-semibold text-[#B91C1C] mt-1">
                  $4,108.00
                </div>
                <span className="text-[11px] text-[var(--color-ink-faint)] mt-0.5 block">
                  3 actionable items
                </span>
              </div>

              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <span className="text-[11px] font-medium text-[var(--color-ink-faint)] uppercase">
                  Scheduled Next Run
                </span>
                <div className="font-num text-2xl font-semibold text-[var(--color-ink)] mt-1">
                  Tonight
                </div>
                <span className="text-[11px] text-[var(--color-ink-muted)] mt-0.5 block">
                  00:00 UTC Automated
                </span>
              </div>
            </div>

            {/* Stepper Preview */}
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas-subtle)]/40 flex items-center justify-between text-xs overflow-x-auto gap-4">
              <span className="font-num font-semibold text-[var(--color-ink-faint)] shrink-0">
                STATE MACHINE:
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="line-through text-[var(--color-ink-faint)]">Draft</span>
                <span className="text-[var(--color-border)]">→</span>
                <span className="line-through text-[var(--color-ink-faint)]">Quotation</span>
                <span className="text-[var(--color-border)]">→</span>
                <span className="line-through text-[var(--color-ink-faint)]">Confirmed</span>
                <span className="text-[var(--color-border)]">→</span>
                <span className="font-semibold px-2.5 py-1 rounded bg-[#0D4A38]/10 text-[#0D4A38] dark:text-[#1BA376] border border-[#0D4A38]/20">
                  Active (Billing Engine Live)
                </span>
                <span className="text-[var(--color-border)]">→</span>
                <span className="text-[var(--color-ink-faint)]">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" className="py-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0D4A38] dark:text-[#15805D]">
              Platform Architecture
            </span>
            <h2 className="font-serif-display text-3xl md:text-4xl font-medium tracking-tight text-[var(--color-ink)]">
              Engineered for absolute accounting integrity.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[#0D4A38] dark:text-[#15805D]">
                <Repeat className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-ink)]">
                Strict Finite State Machine
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Deterministic lifecycle: Draft to Quotation to Confirmed to Active to Closed. Illegal state jumps are rejected with structured 400 violations and clear next-action remediation.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[#0D4A38] dark:text-[#15805D]">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-ink)]">
                Sub-2ms Compound Aggregation
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Compound indexed pipelines <code className="font-num text-[10px]">status_1_issue_date_1</code> compute active contracts, paid totals, and overdue liabilities across tens of thousands of records in under 2ms.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[#0D4A38] dark:text-[#15805D]">
                <Percent className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-ink)]">
                Tax Jurisdictions & Rules Engine
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Automated statutory tax compliance (GST, VAT, State Sales Tax) paired with a constraint-validated discount engine enforcing usage caps and minimum contract values.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Plan Catalog */}
      <section id="pricing" className="py-20 border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0D4A38] dark:text-[#15805D]">
              Recurring Contract Plans
            </span>
            <h2 className="font-serif-display text-3xl md:text-4xl font-medium tracking-tight text-[var(--color-ink)]">
              Transparent enterprise licensing.
            </h2>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Configured directly within Cadence with automated cycle renewals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_PLANS.map((plan, idx) => (
              <div
                key={plan._id}
                className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between space-y-6 shadow-xs hover:border-[var(--color-ink-faint)] transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-serif-display text-xl font-semibold text-[var(--color-ink)]">
                      {plan.name}
                    </span>
                    <span className="text-[11px] font-num px-2 py-0.5 rounded bg-[var(--color-canvas-subtle)] border border-[var(--color-border)]">
                      {plan.billing_frequency}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Enterprise service configuration with minimum {plan.minimum_quantity} seat capacity.
                  </p>

                  <div className="pt-2 border-t border-[var(--color-border)] space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#15805D]" />
                      <span>Renewal Behavior: {plan.renewal_behavior}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#15805D]" />
                      <span>Sub-millisecond billing automation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#15805D]" />
                      <span>Formal PDF & printable tax invoices</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant={idx === 0 ? 'primary' : 'outline'}
                  size="md"
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                >
                  Configure Subscription
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-12 px-6 text-xs text-[var(--color-ink-muted)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#0D4A38] dark:bg-[#15805D] text-white flex items-center justify-center font-serif-display text-sm font-bold">
              C
            </div>
            <span className="font-serif-display font-medium text-sm text-[var(--color-ink)]">
              Cadence Financial Systems
            </span>
            <span className="text-[var(--color-ink-faint)]">© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-[var(--color-ink)] transition-colors">
              Operator Sign In
            </Link>
            <Link to="/portal" className="hover:text-[var(--color-ink)] transition-colors">
              Customer Portal
            </Link>
            <Link to="/dashboard" className="hover:text-[var(--color-ink)] transition-colors">
              Executive Console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
