import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
      });

      // Pass email and non-production OTP fallback to verification screen
      navigate('/verify-otp', {
        state: {
          email: formData.email.trim(),
          devOtp: res?.otp,
        },
      });
    } catch (err) {
      setError(err.message || 'Unable to register account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[var(--color-canvas)] paper-texture text-[var(--color-ink)]">
      {/* Left Form Panel */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[var(--color-ink)] text-[var(--color-canvas)] flex items-center justify-center font-serif text-lg font-bold">
              C
            </div>
            <span className="font-serif-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
              Cadence
            </span>
          </Link>
        </div>

        <div className="max-w-sm w-full mx-auto my-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="font-serif-display text-3xl font-normal tracking-tight">
              Create an Account
            </h1>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Open a new workspace to manage subscriptions, contracts, and invoices.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] text-xs text-[var(--color-accent)] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name / Entity"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Acme Corporation"
              required
              autoFocus
            />

            <Input
              label="Work Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="billing@acme.com"
              required
            />

            <Input
              label="Account Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              required
            />

            <Input
              label="Phone Number (Optional)"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
              icon={ArrowRight}
            >
              Continue to Verification
            </Button>
          </form>

          <div className="pt-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-ink-muted)]">
            Already registered?{' '}
            <Link to="/login" className="text-[var(--color-accent)] font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <div className="text-[11px] text-[var(--color-ink-faint)] font-mono">
          Security: Two-Factor Verification Required
        </div>
      </div>

      {/* Right Editorial Panel */}
      <div className="hidden lg:col-span-7 lg:flex flex-col justify-between p-16 bg-[var(--color-canvas)]">
        <div className="max-w-xl space-y-6">
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
            The Financial Operating System
          </p>
          <blockquote className="font-serif-display text-4xl lg:text-5xl font-light leading-tight tracking-tight text-[var(--color-ink)]">
            “No hidden fees. Every calculation adheres strictly to statutory tax and discount rules.”
          </blockquote>
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-xs text-[var(--color-ink-muted)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
              <span>State machine contract lifecycle (Draft $\rightarrow$ Quotation $\rightarrow$ Confirmed $\rightarrow$ Active)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--color-ink-muted)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Automated idempotent recurring billing cycle</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--color-ink-muted)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Full partial payment reconciliation and balance due ledger</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-[var(--color-ink-faint)] font-mono">
          Cadence Enterprise Architecture
        </div>
      </div>
    </div>
  );
}
