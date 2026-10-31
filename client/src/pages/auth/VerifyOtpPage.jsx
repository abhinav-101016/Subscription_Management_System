import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import { ShieldCheck } from 'lucide-react';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState(location.state?.email || 'alexander@mercury-holdings.co');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only accept numbers
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto-advance
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

    const newDigits = [...digits];
    for (let i = 0; i < paste.length; i++) {
      newDigits[i] = paste[i];
    }
    setDigits(newDigits);

    const targetIdx = Math.min(paste.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      toast.warning('Please enter all 6 verification digits');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, code);
      toast.success('Identity verified successfully', 'Access Granted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Invalid or expired OTP', 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[var(--color-canvas)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-xl bg-[#0D4A38] dark:bg-[#15805D] text-white items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="font-serif-display text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Two-Factor Challenge
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Enter the 6-digit security code sent to <br />
            <span className="font-num font-medium text-[var(--color-ink)]">{email}</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
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
                  className="w-11 h-12 text-center text-lg font-num font-semibold rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] focus:border-[#0D4A38] dark:focus:border-[#15805D] focus:ring-1 focus:ring-[#0D4A38] focus:outline-none transition-colors"
                />
              ))}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Verify Code
            </Button>
          </form>

          <div className="text-center text-xs text-[var(--color-ink-muted)] pt-2 space-y-2">
            <p>
              Didn't receive code?{' '}
              <button
                onClick={() => toast.info('A new OTP has been dispatched to your inbox.')}
                className="text-[#0D4A38] dark:text-[#15805D] font-medium hover:underline"
              >
                Resend code
              </button>
            </p>
            <div>
              <Link to="/login" className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
