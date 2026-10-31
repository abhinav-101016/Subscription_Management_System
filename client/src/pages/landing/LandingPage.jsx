import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Layers,
  CreditCard,
  Zap,
  Percent,
  Sliders,
  Moon,
  Sun,
  Calculator,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { MoneyText } from '../../components/ui/MoneyText';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../lib/apiClient';
import { formatCurrency } from '../../lib/utils';
import { getDefaultPathForRole } from '../../routes/routeConfig';

export default function LandingPage() {
  const { isAuthenticated, role } = useAuth();
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  // Tiny live calculator state
  const [calcAmount, setCalcAmount] = useState(1000);
  const [calcTaxRate, setCalcTaxRate] = useState(18);
  const [calcDiscountRate, setCalcDiscountRate] = useState(10);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Real plans from backend
  const { data: plans = [] } = useQuery({
    queryKey: ['landing-plans'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/plans');
        return Array.isArray(res) ? res : res?.data || [];
      } catch {
        return [];
      }
    },
  });

  // Calculations for live calculator
  const discountVal = (calcAmount * calcDiscountRate) / 100;
  const taxableBase = Math.max(0, calcAmount - discountVal);
  const taxVal = (taxableBase * calcTaxRate) / 100;
  const grandTotal = taxableBase + taxVal;

  const appPath = getDefaultPathForRole(role);

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] paper-texture text-[var(--color-ink)]">
      {/* Top Ledger Navbar */}
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[var(--color-ink)] text-[var(--color-canvas)] flex items-center justify-center font-serif text-lg font-bold">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-serif-display text-lg font-semibold tracking-tight text-[var(--color-ink)] leading-none">
                Cadence
              </span>
              <span className="text-[10px] text-[var(--color-ink-muted)] font-mono uppercase tracking-widest mt-0.5">
                Subscription Operations
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-mono text-[var(--color-ink-muted)]">
            <a href="#lifecycle" className="hover:text-[var(--color-ink)] transition-colors">
              Contract Lifecycle
            </a>
            <a href="#billing" className="hover:text-[var(--color-ink)] transition-colors">
              Idempotent Billing
            </a>
            <a href="#calculator" className="hover:text-[var(--color-ink)] transition-colors">
              Tax & Discounts
            </a>
            {plans.length > 0 && (
              <a href="#plans" className="hover:text-[var(--color-ink)] transition-colors">
                Available Plans
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className="p-2 rounded border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {isAuthenticated ? (
              <Link to={appPath}>
                <Button variant="primary" size="sm">
                  Open Workspace
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-28 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-mono text-[var(--color-ink-muted)]">
              <span>Recurring Billing & Contract Engine</span>
            </div>

            <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.15] text-[var(--color-ink)]">
              Quotations, contracts, recurring invoices, and payments in one ledger.
            </h1>

            <p className="text-sm sm:text-base text-[var(--color-ink-muted)] leading-relaxed max-w-xl">
              Cadence runs enterprise recurring-billing lifecycles from proposal to payment reconciliation. Enforce state machines, execute scheduled automated billing runs, and keep accounts receivable balanced.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/signup">
                <Button variant="primary" size="lg" icon={ArrowRight}>
                  Create Free Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign In to Workspace
                </Button>
              </Link>
            </div>
          </div>

          {/* Real Invoice Document Component as Product Visual (Clearly Labeled Sample Data) */}
          <div className="lg:col-span-5">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm space-y-5 relative">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[var(--color-ink)] text-[var(--color-canvas)] flex items-center justify-center font-serif text-xs font-bold">
                    C
                  </div>
                  <span className="font-serif-display font-semibold text-sm">SAMPLE STATEMENT</span>
                </div>
                <span className="stamp-paid text-[10px] px-2 py-0.5 rounded font-mono">
                  CONFIRMED
                </span>
              </div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between font-mono text-[11px] text-[var(--color-ink-muted)]">
                  <span>Invoice #</span>
                  <span className="text-[var(--color-ink)] font-bold">INV-202610-SAMPLE</span>
                </div>
                <div className="flex justify-between font-mono text-[11px] text-[var(--color-ink-muted)]">
                  <span>Customer</span>
                  <span className="text-[var(--color-ink)]">Acme Industrial Corp</span>
                </div>
              </div>

              <div className="border border-[var(--color-border)] rounded overflow-hidden text-xs">
                <div className="bg-[var(--color-canvas)] p-2 font-mono text-[10px] text-[var(--color-ink-muted)] flex justify-between">
                  <span>Contract Line</span>
                  <span>Amount</span>
                </div>
                <div className="p-2.5 flex justify-between font-mono text-[11px] border-t border-[var(--color-border)]">
                  <span>Platform License (5 seats)</span>
                  <span className="font-semibold">{formatCurrency(750)}</span>
                </div>
                <div className="p-2.5 flex justify-between font-mono text-[11px] border-t border-[var(--color-border)] text-emerald-700 dark:text-emerald-400">
                  <span>Promotional Discount (10%)</span>
                  <span>-{formatCurrency(75)}</span>
                </div>
                <div className="p-2.5 flex justify-between font-mono text-[11px] border-t border-[var(--color-border)]">
                  <span>Statutory VAT (18%)</span>
                  <span>+{formatCurrency(121.5)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
                <span className="font-serif-display text-sm font-semibold">Balance Due</span>
                <span className="font-serif-display text-xl font-bold text-[var(--color-accent)] font-num">
                  {formatCurrency(796.5)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Contract Lifecycle Stepper */}
      <section id="lifecycle" className="py-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-accent)] font-bold">
              Predictable Governance
            </span>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-normal">
              A strict 5-stage subscription lifecycle state machine.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] leading-relaxed">
              Subscriptions cannot skip stages or activate prematurely. Every transition is validated by the database.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {[
              { step: '1. Draft', desc: 'Initialize proposal, assign client, bundle items' },
              { step: '2. Quotation', desc: 'Share formal offer with price validity terms' },
              { step: '3. Confirmed', desc: 'Lock commercial agreements and payment terms' },
              { step: '4. Active', desc: 'Deliver service and trigger recurring billing runs' },
              { step: '5. Closed', desc: 'Orderly termination upon expiration or early close' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] space-y-2"
              >
                <div className="font-serif-display text-lg font-semibold text-[var(--color-ink)]">
                  {s.step}
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Automated Idempotent Billing */}
      <section id="billing" className="py-20 border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-accent)] font-bold">
                Automated Engine
              </span>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-normal">
                Execute billing runs without risk of duplicate invoices.
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] leading-relaxed">
                Compound indexes on contract status and billing period boundaries ensure that running the engine against any reference date produces exactly one invoice per active cycle.
              </p>
            </div>

            <div className="lg:col-span-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 font-mono text-xs space-y-3">
              <div className="text-[10px] uppercase text-[var(--color-ink-muted)] pb-2 border-b border-[var(--color-border)]">
                Engine Run Simulation
              </div>
              <div className="text-emerald-700 dark:text-emerald-400">
                ✓ Evaluated active contracts across database
              </div>
              <div className="text-emerald-700 dark:text-emerald-400">
                ✓ Applied statutory tax rules and applicable discounts
              </div>
              <div className="text-[var(--color-ink-muted)]">
                • Idempotency verified: 0 duplicate periods generated
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Live Tax & Discount Calculator */}
      <section id="calculator" className="py-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="max-w-xl space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-accent)] font-bold">
              Transparent Calculations
            </span>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-normal">
              Interactive Tax & Discount Calculator
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] leading-relaxed">
              Test how discount deductions and statutory tax percentages interact on gross contract lines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start max-w-4xl">
            <div className="md:col-span-6 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-xl p-6 space-y-4">
              <div>
                <label className="text-xs font-mono text-[var(--color-ink-muted)] block mb-1">
                  Contract Subtotal ({formatCurrency(calcAmount)})
                </label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--color-ink-muted)] block mb-1">
                  Promotional Discount ({calcDiscountRate}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={calcDiscountRate}
                  onChange={(e) => setCalcDiscountRate(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--color-ink-muted)] block mb-1">
                  Statutory Tax Rate ({calcTaxRate}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="28"
                  step="1"
                  value={calcTaxRate}
                  onChange={(e) => setCalcTaxRate(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)]"
                />
              </div>
            </div>

            <div className="md:col-span-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-3 font-mono text-xs">
              <span className="text-[10px] uppercase text-[var(--color-ink-muted)] block border-b border-[var(--color-border)] pb-2 font-semibold">
                Calculation Breakdown
              </span>
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span className="font-semibold">{formatCurrency(calcAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Discount ({calcDiscountRate}%):</span>
                <span>-{formatCurrency(discountVal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxable Base:</span>
                <span>{formatCurrency(taxableBase)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({calcTaxRate}%):</span>
                <span>+{formatCurrency(taxVal)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[var(--color-border)] font-bold text-sm text-[var(--color-accent)]">
                <span>Final Invoiced Total:</span>
                <span className="font-num text-base">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Real Plans pulled from /api/plans (Hidden if empty) */}
      {plans.length > 0 && (
        <section id="plans" className="py-20 border-t border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="max-w-2xl space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-accent)] font-bold">
                Available Plans
              </span>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-normal">
                Standard recurring billing tiers.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div
                  key={p._id}
                  className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase text-[var(--color-ink-muted)]">
                      {p.billing_frequency}
                    </span>
                    <h3 className="font-serif-display text-2xl font-semibold">
                      {p.name}
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      Renewal behavior: <strong className="font-mono text-[var(--color-ink)]">{p.renewal_behavior}</strong>
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)] font-mono">
                      Min Quantity: {p.minimum_quantity || 1}
                    </p>
                  </div>

                  <Link to="/signup" className="pt-4">
                    <Button variant="secondary" size="sm" className="w-full">
                      Select Plan
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-ink-muted)] font-mono">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[var(--color-ink)] text-[var(--color-canvas)] flex items-center justify-center font-serif text-xs font-bold">
              C
            </div>
            <span>Cadence Enterprise Recurring Billing Infrastructure</span>
          </div>
          <div>Strict Financial Operations • MongoDB Aggregation Engine</div>
        </div>
      </footer>
    </div>
  );
}
