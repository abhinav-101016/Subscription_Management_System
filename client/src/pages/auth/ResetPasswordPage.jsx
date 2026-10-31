import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState(location.state?.devOtp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim(), otp.trim(), newPassword);
      toast.success('Password updated successfully', 'Please sign in with your new password');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] paper-texture flex items-center justify-center p-6 text-[var(--color-ink)]">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h1 className="font-serif-display text-2xl font-normal tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Enter your verification code and choose a new password.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] text-xs text-[var(--color-accent)] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="6-Digit Reset Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="e.g. 123456"
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />

          <Button type="submit" variant="primary" className="w-full mt-2" loading={loading} icon={ArrowRight}>
            Update Password & Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
