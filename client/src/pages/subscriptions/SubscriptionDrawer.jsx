import React, { useState } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ResourcePicker } from '../../components/ui/ResourcePicker';
import { MOCK_PLANS } from '../../lib/mocks';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export function SubscriptionDrawer({ open, onClose, onCreated }) {
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState(MOCK_PLANS[0]?._id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([
    { product_variant_id: '672458a4e8d3570000000001', quantity: 5, unit_price: 120 },
  ]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAddLine = () => {
    setLines([
      ...lines,
      { product_variant_id: '672458a4e8d3570000000002', quantity: 1, unit_price: 450 },
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

    setLoading(true);
    try {
      const payload = {
        customer_id: customerId,
        plan_id: planId,
        start_date: startDate,
        lines: lines.map((l) => ({
          product_variant_id: l.product_variant_id,
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
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
          >
            {MOCK_PLANS.map((plan) => (
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
            <span className="text-xs font-semibold uppercase text-[var(--color-ink-muted)]">
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
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--color-ink-muted)]">
                    Item #{idx + 1}
                  </span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-[var(--color-ink-faint)] hover:text-[#B91C1C] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <ResourcePicker
                  type="variant"
                  value={line.product_variant_id}
                  onChange={(val) => handleLineChange(idx, 'product_variant_id', val)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Quantity"
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                  />
                  <Input
                    label="Unit Price ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_price}
                    onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] text-xs font-medium">
            <span>Estimated Cycle Subtotal:</span>
            <span className="font-num text-sm text-[var(--color-ink)]">
              ${grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Subscription
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

