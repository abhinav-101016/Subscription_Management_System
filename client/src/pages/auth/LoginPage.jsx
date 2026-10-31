import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';
import { ArrowRight, ShieldCheck, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('alexander@mercury-holdings.co');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully', 'Welcome back');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials', 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role) => {
    switchRole(role);
    toast.info(`Switched to ${role.toUpperCase()} persona`);
    if (role === 'customer') {
      navigate('/portal');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[var(--color-canvas)]">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-xl bg-[#0D4A38] dark:bg-[#15805D] text-white items-center justify-center font-serif-display text-xl font-bold shadow-sm">
            C
          </div>
          <h1 className="font-serif-display text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Cadence
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Subscription Lifecycle & Recurring Settlement
          </p>
        </div>

        {/* Card */}
        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <Link
                to="/verify-otp"
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline underline-offset-2"
              >
                Verify with OTP
              </Link>
              <Link
                to="/signup"
                className="text-[#0D4A38] dark:text-[#15805D] font-medium hover:underline"
              >
                Create account
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
            <p className="text-[10px] uppercase font-semibold text-center tracking-wider text-[var(--color-ink-faint)]">
              Instant Demo Access
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => handleQuickDemo('admin')}
              >
                Admin
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => handleQuickDemo('staff')}
              >
                Staff
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => handleQuickDemo('customer')}
              >
                Customer
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--color-ink-faint)]">
          Protected by role-based RBAC and audit logs.
        </p>
      </div>
    </div>
  );
}
