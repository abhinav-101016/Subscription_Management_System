import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowRight, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setMessage('Password reset instructions have been dispatched.');
      navigate('/reset-password', { state: { email: email.trim(), devOtp: res?.otp } });
    } catch (err) {
      setError(err.message || 'Unable to process reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] paper-texture flex items-center justify-center p-6 text-[var(--color-ink)]">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
            <KeyRound className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h1 className="font-serif-display text-2xl font-normal tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Enter your account email to receive a password recovery security code.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] text-xs text-[var(--color-accent)] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Account Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. user@example.com"
            required
            autoFocus
          />

          <Button type="submit" variant="primary" className="w-full" loading={loading} icon={ArrowRight}>
            Send Reset Code
          </Button>
        </form>

        <div className="pt-2 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-ink-muted)]">
          Remember your credentials?{' '}
          <Link to="/login" className="text-[var(--color-accent)] hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

