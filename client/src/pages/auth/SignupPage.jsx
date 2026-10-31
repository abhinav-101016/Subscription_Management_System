import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(formData);
      toast.success('Registration code dispatched to your email', 'Account Created');
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      toast.error(err.message || 'Signup failed', 'Registration Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[var(--color-canvas)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-xl bg-[#0D4A38] dark:bg-[#15805D] text-white items-center justify-center font-serif-display text-xl font-bold shadow-sm">
            C
          </div>
          <h1 className="font-serif-display text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Create an Account
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Enterprise subscription lifecycle platform
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Sarah Jenkins"
            />

            <Input
              label="Work Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="sarah@acme.com"
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="At least 8 characters"
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Continue to Verification
            </Button>
          </form>

          <div className="text-center text-xs text-[var(--color-ink-muted)] pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0D4A38] dark:text-[#15805D] font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
