import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import { ShieldCheck, Copy, Sparkles, ArrowRight } from 'lucide-react';
import { getDefaultPathForRole } from '../../routes/routeConfig';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState(location.state?.email || '');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [serverError, setServerError] = useState('');
  const [devOtp, setDevOtp] = useState(location.state?.devOtp || location.state?.otp || null);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    if (location.state?.devOtp || location.state?.otp) {
      setDevOtp(String(location.state.devOtp || location.state.otp));
    }
  }, [location.state]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    fillOtp(paste);
  };

  const fillOtp = (codeStr) => {
    const clean = String(codeStr).replace(/\D/g, '').slice(0, 6);
    const newDigits = [...digits];
    for (let i = 0; i < clean.length; i++) {
      newDigits[i] = clean[i];
    }
    setDigits(newDigits);
    const nextIdx = Math.min(clean.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const otpCode = digits.join('');
    if (otpCode.length !== 6) {
      setServerError('Please enter all 6 digits of your security code.');
      return;
    }

    if (!email) {
      setServerError('Missing email address. Please return to signup.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email, otpCode);
      toast.success('Account verified successfully', 'Access granted');
      const role = res?.user?.role || 'customer';
      navigate(getDefaultPathForRole(role), { replace: true });
    } catch (err) {
      setServerError(err.message || 'Invalid or expired OTP security code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    if (!email) {
      toast.warning('No email provided to dispatch code to.');
      return;
    }

    setResending(true);
    setServerError('');
    try {
      const res = await resendOtp(email);
      if (res?.otp) {
        setDevOtp(String(res.otp));
      }
      setCountdown(60);
      toast.info('A fresh security code has been dispatched.');
    } catch (err) {
      setServerError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] paper-texture flex items-center justify-center p-6 text-[var(--color-ink)]">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 space-y-6 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h1 className="font-serif-display text-2xl font-normal tracking-tight">
            Security Verification
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Enter the 6-digit confirmation code sent to{' '}
            <span className="font-mono text-[var(--color-ink)] font-semibold">{email || 'your email'}</span>
          </p>
        </div>

        {/* Development Helper Badge
        {devOtp && (
          <div className="p-2.5 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] flex items-center justify-between text-xs text-[var(--color-accent)]">
            <div className="flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dev Code: <strong className="tracking-widest">{devOtp}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => fillOtp(devOtp)}
              className="text-[11px] font-semibold underline hover:no-underline"
            >
              Auto-fill
            </button>
          </div>
        )} */}

        {serverError && (
          <div className="p-3 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] text-xs text-[var(--color-accent)] font-medium">
            {serverError}
          </div>
        )}

        {/* 6-box input */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 text-center text-xl font-num font-semibold rounded-md border border-[var(--color-border)] bg-[var(--color-canvas)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:outline-hidden transition-all text-[var(--color-ink)]"
              />
            ))}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
            icon={ArrowRight}
          >
            Verify Security Code
          </Button>
        </form>

        {/* Resend and Sign in options */}
        <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="text-[var(--color-accent)] hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </button>

          <Link to="/login" className="hover:text-[var(--color-ink)] transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
