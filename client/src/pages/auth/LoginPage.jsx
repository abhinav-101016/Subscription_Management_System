import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { getDefaultPathForRole } from '../../routes/routeConfig';
import { formatCurrency } from '../../lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const searchParams = new URLSearchParams(location.search);
  const nextParam = searchParams.get('next');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      const userRole = res.user?.role || 'customer';
      toast.success('Signed in successfully', `Welcome back, ${res.user?.name || res.user?.email}`);
      const targetPath = nextParam ? decodeURIComponent(nextParam) : getDefaultPathForRole(userRole);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[var(--color-canvas)] paper-texture text-[var(--color-ink)]">
      {/* Left Form Panel */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-[var(--color-ink)] text-[var(--color-canvas)] flex items-center justify-center font-serif text-lg font-bold">
              C
            </div>
            <span className="font-serif-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
              Cadence
            </span>
          </Link>
        </div>

        <div className="max-w-sm w-full mx-auto my-12 space-y-6">
          <div className="space-y-1.5">
            <h1 className="font-serif-display text-3xl font-normal tracking-tight">
              Sign In to Ledger
            </h1>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Enter your credentials to access your contracts, invoices, and reports.
            </p>
          </div>

          {serverError && (
            <div className="p-3 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] text-xs text-[var(--color-accent)] font-medium">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@example.com"
              required
              autoFocus
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--color-ink-muted)]">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--color-accent)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          <div className="pt-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-ink-muted)]">
            Don’t have an account?{' '}
            <Link to="/signup" className="text-[var(--color-accent)] font-medium hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        <div className="text-[11px] text-[var(--color-ink-faint)] font-mono">
          Security: TLS 1.3 • AES-256 Encrypted Session
        </div>
      </div>

      {/* Right Typographic Editorial Panel (The Ledger Statement) */}
      <div className="hidden lg:col-span-7 lg:flex flex-col justify-between p-16 bg-[var(--color-canvas)] relative overflow-hidden">
        <div className="max-w-xl space-y-6 z-10">
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
            Contract Billing & Reconciliation
          </p>
          <blockquote className="font-serif-display text-4xl lg:text-5xl font-light leading-tight tracking-tight text-[var(--color-ink)]">
            “Recurring revenue demands the mathematical certainty of a printed statement.”
          </blockquote>
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed max-w-lg">
            Cadence provides contract state-machines, automated idempotent billing runs, and real-time ledger reconciliation without mock artifacts.
          </p>
        </div>

        {/* Ruled Invoice Excerpt Document Graphic */}
        <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 shadow-sm z-10 space-y-4">
          <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-3">
            <div>
              <span className="font-serif-display text-sm font-semibold">STATEMENT EXCERPT</span>
              <p className="text-[10px] font-mono text-[var(--color-ink-muted)]">RECORD #INV-202610-001</p>
            </div>
            <div className="stamp-paid text-[10px] px-2 py-0.5 rounded">
              VERIFIED
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)] font-mono text-[11px]">
              <span>Recurring Service License (Monthly)</span>
              <span className="font-semibold">{formatCurrency(1500)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)] font-mono text-[11px]">
              <span>Statutory VAT (18%)</span>
              <span>{formatCurrency(270)}</span>
            </div>
            <div className="flex justify-between pt-1 font-serif-display text-sm font-bold">
              <span>Settled Total</span>
              <span className="font-num font-bold text-[var(--color-accent)]">{formatCurrency(1770)}</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-[var(--color-ink-faint)] font-mono z-10">
          Cadence Enterprise Recurring Infrastructure
        </div>
      </div>
    </div>
  );
}
