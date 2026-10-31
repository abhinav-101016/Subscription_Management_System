import React, { useState, useEffect } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { MoneyText } from '../../components/ui/MoneyText';
import { api } from '../../lib/apiClient';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export function RecordPaymentDialog({
  open,
  onClose,
  invoice,
  onSuccess,
  onPaymentRecorded,
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Credit Card');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const due = Number(invoice?.amount_due !== undefined ? invoice.amount_due : (invoice?.grand_total || 0));

  useEffect(() => {
    if (invoice && open) {
      setAmount(due > 0 ? String(due) : '');
      setError('');
      setNotes('');
    }
  }, [invoice, due, open]);

  const numAmount = Number(amount) || 0;
  const remainingAfterPayment = Math.max(0, due - numAmount);

  const handleAmountChange = (val) => {
    setAmount(val);
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      setError('Payment amount must be greater than 0');
    } else if (num > due) {
      setError(`Amount cannot exceed the balance due (${formatCurrency(due)})`);
    } else {
      setError('');
    }
  };

  const handlePayFull = () => {
    setAmount(String(due));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a positive settlement amount');
      return;
    }
    if (numAmount > due) {
      setError(`Amount cannot exceed total balance due (${formatCurrency(due)})`);
      return;
    }

    if (invoice.status !== 'Confirmed') {
      setError(`Cannot record payment on an invoice with status '${invoice.status}'. Invoice must be Confirmed.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        invoice_id: invoice._id || invoice.id,
        amount: numAmount,
        method,
        payment_date: paymentDate,
        notes: notes.trim() || undefined,
      };

      const result = await api.post('/api/payments', payload);
      toast.success(
        `Recorded ${formatCurrency(numAmount)} settlement`,
        `Invoice ${invoice.invoice_number} balance updated`
      );

      if (onSuccess) onSuccess(result);
      if (onPaymentRecorded) onPaymentRecorded(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Payment recording failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record Payment Settlement"
      description={`Record cash or card receipt against Invoice ${invoice?.invoice_number || ''}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] flex items-start gap-2 text-xs text-[var(--color-accent)]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Balance Due Context */}
        <div className="p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--color-ink-muted)]">Current Outstanding:</span>
          <div className="flex items-center gap-2">
            <MoneyText amount={due} className="font-bold text-sm text-[var(--color-accent)]" />
            <button
              type="button"
              onClick={handlePayFull}
              className="text-[11px] underline text-[var(--color-ink)] hover:text-[var(--color-accent)] font-semibold"
            >
              Pay Full
            </button>
          </div>
        </div>

        <Input
          label="Payment Amount"
          type="number"
          step="0.01"
          min="0.01"
          max={due}
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Payment Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Wire (ACH / NEFT)</option>
            <option value="UPI">UPI / Instant Transfer</option>
            <option value="Check">Corporate Check</option>
            <option value="Cash">Cash Ledger</option>
          </Select>

          <Input
            label="Posting Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Internal Reference Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Bank transaction ref / PO check #"
        />

        {/* Live Remaining Balance Calculation */}
        <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--color-ink-muted)]">Remaining Due After Payment:</span>
          <MoneyText
            amount={remainingAfterPayment}
            className={`font-semibold text-sm ${remainingAfterPayment === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--color-ink)]'}`}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} disabled={!!error || !numAmount}>
            Confirm Settlement
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
