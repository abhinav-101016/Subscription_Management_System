import React, { useState, useEffect } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { MoneyText } from '../../components/ui/MoneyText';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../hooks/useToast';

export function RecordPaymentDialog({
  open,
  onClose,
  invoice,
  onPaymentRecorded,
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Credit Card');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const due = Number(invoice?.amount_due ?? invoice?.grand_total ?? 0);

  useEffect(() => {
    if (invoice) {
      setAmount(due > 0 ? String(due) : '');
      setError('');
    }
  }, [invoice, due]);

  const handleAmountChange = (val) => {
    setAmount(val);
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      setError('Payment amount must be greater than 0');
    } else if (num > due) {
      setError(`Amount cannot exceed the balance due ($${due.toFixed(2)})`);
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
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (numAmount > due) {
      setError(`Amount exceeds total balance due`);
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: invoice._id,
          amount: numAmount,
          method,
          payment_date: paymentDate,
          notes,
        }),
      });

      toast.success(
        `Payment of $${numAmount.toFixed(2)} recorded successfully`,
        'Ledger Reconciled'
      );
      if (onPaymentRecorded) {
        onPaymentRecorded(result);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Payment reconciliation failed', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record Payment"
      description={`Post settlement against invoice ${invoice?.invoice_number || ''}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Outstanding Balance Banner */}
        <div className="p-3 rounded-lg bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] flex items-center justify-between text-xs">
          <div>
            <span className="text-[var(--color-ink-muted)]">Outstanding Balance:</span>
            <div className="font-num text-sm font-semibold text-[var(--color-ink)]">
              <MoneyText amount={due} />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handlePayFull}
          >
            Pay Full Balance
          </Button>
        </div>

        <Input
          label="Payment Amount ($)"
          type="number"
          step="0.01"
          min="0.01"
          max={due}
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          required
          error={error}
          prefix="$"
        />

        <Select
          label="Payment Method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="Credit Card">Credit Card (Stripe / Stripe Elements)</option>
          <option value="Bank Transfer">Bank Transfer / Fedwire</option>
          <option value="ACH">ACH Direct Debit</option>
          <option value="Check">Check / Physical Draft</option>
          <option value="Manual Wire">Manual Wire Transfer</option>
        </Select>

        <Input
          label="Settlement Date"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />

        <Input
          label="Reference / Ledger Note (Optional)"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Wire confirmation ref #TX-8921"
        />

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={Boolean(error)}>
            Confirm Payment
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

