import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ResourcePicker } from '../../components/ui/ResourcePicker';
import { api } from '../../lib/apiClient';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { MoneyText } from '../../components/ui/MoneyText';

export function SubscriptionDrawer({ open, onClose, onCreated }) {
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([
    { product_variant_id: '', quantity: 1, unit_price: 100 },
  ]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const { data: plans = [] } = useQuery({
    queryKey: ['plans-list'],
    queryFn: async () => {
      const res = await api.get('/api/plans');
      const list = Array.isArray(res) ? res : res?.data || [];
      if (list.length > 0 && !planId) {
        setPlanId(list[0]._id);
      }
      return list;
    },
  });

  const handleAddLine = () => {
    setLines([
      ...lines,
      { product_variant_id: '', quantity: 1, unit_price: 100 },
    ]);
  };

  const handleRemoveLine = (idx) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = field === 'quantity' || field === 'unit_price' ? Number(value) : value;
    setLines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      toast.warning('Please select a customer account');
      return;
    }
    const selectedPlan = planId || plans[0]?._id;
    if (!selectedPlan) {
      toast.warning('Please select a valid plan');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: customerId,
        plan_id: selectedPlan,
        start_date: startDate,
        lines: lines.map((l) => ({
          product_variant_id: l.product_variant_id || undefined,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
      };

      await onCreated(payload);
      toast.success('Subscription draft initialized');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create subscription', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = lines.reduce((acc, l) => acc + (l.quantity * l.unit_price), 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create Subscription"
      description="Initialize a new recurring customer contract in Draft status."
      width="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ResourcePicker
          type="customer"
          value={customerId}
          onChange={setCustomerId}
          label="Customer Account"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Plan Configuration"
            value={planId || (plans[0]?._id || '')}
            onChange={(e) => setPlanId(e.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan._id} value={plan._id}>
                {plan.name} ({plan.billing_frequency})
              </option>
            ))}
          </Select>

          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        {/* Contract Line Items */}
        <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase font-mono tracking-wider text-[var(--color-ink-muted)]">
              Subscription Line Items
            </span>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={handleAddLine}
              icon={Plus}
            >
              Add Line
            </Button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] space-y-3"
              >
                <ResourcePicker
                  type="variant"
                  value={line.product_variant_id}
                  onChange={(val) => handleLineChange(idx, 'product_variant_id', val)}
                  label={`Line #${idx + 1} Variant`}
                />

                <div className="grid grid-cols-3 gap-3 items-end">
                  <Input
                    label="Qty"
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                    required
                  />

                  <Input
                    label="Unit Price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.unit_price}
                    onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                    required
                  />

                  <div className="flex items-center justify-between pb-1.5">
                    <div className="text-xs">
                      <span className="text-[var(--color-ink-muted)] block text-[10px]">Total</span>
                      <MoneyText amount={line.quantity * line.unit_price} className="font-semibold" />
                    </div>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Summary Footer */}
        <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between">
          <span className="text-xs uppercase font-mono text-[var(--color-ink-muted)]">
            Initial Contract Total
          </span>
          <MoneyText amount={grandTotal} className="text-lg font-serif-display text-[var(--color-ink)]" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save Draft Contract
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
