import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../hooks/useToast';
import { AlertCircle } from 'lucide-react';

export function PlanDrawer({ open, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    billing_frequency: 'Monthly',
    minimum_quantity: 1,
    available_from: new Date().toISOString().slice(0, 10),
    available_to: '',
    renewal_behavior: 'Renew',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        billing_frequency: initialData.billing_frequency || 'Monthly',
        minimum_quantity: initialData.minimum_quantity || 1,
        available_from: initialData.available_from ? initialData.available_from.slice(0, 10) : new Date().toISOString().slice(0, 10),
        available_to: initialData.available_to ? initialData.available_to.slice(0, 10) : '',
        renewal_behavior: initialData.renewal_behavior || 'Renew',
        active: initialData.active !== undefined ? initialData.active : true,
      });
    } else {
      setFormData({
        name: '',
        billing_frequency: 'Monthly',
        minimum_quantity: 1,
        available_from: new Date().toISOString().slice(0, 10),
        available_to: '',
        renewal_behavior: 'Renew',
        active: true,
      });
    }
    setDateError('');
  }, [initialData, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDateError('');

    // Strict validation: available_to >= available_from
    if (formData.available_to && formData.available_from) {
      if (new Date(formData.available_to) < new Date(formData.available_from)) {
        setDateError('Available To date must be on or after Available From date.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        minimum_quantity: Number(formData.minimum_quantity) || 1,
        available_to: formData.available_to ? formData.available_to : null,
      };

      await onSave(payload, initialData?._id);
      toast.success(initialData ? 'Plan updated' : 'Plan created');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Billing Plan' : 'New Billing Plan'}
      description="Configure plan recurrence frequency, minimum quantities, and renewal end behaviors."
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {dateError && (
          <div className="p-3 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] flex items-center gap-2 text-xs text-[var(--color-accent)] font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dateError}</span>
          </div>
        )}

        <Input
          label="Plan Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Enterprise Tier"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Billing Frequency"
            value={formData.billing_frequency}
            onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </Select>

          <Input
            label="Minimum Quantity"
            type="number"
            min="1"
            value={formData.minimum_quantity}
            onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
            required
          />
        </div>

        <Select
          label="Renewal Behavior"
          value={formData.renewal_behavior}
          onChange={(e) => setFormData({ ...formData, renewal_behavior: e.target.value })}
        >
          <option value="Renew">Renew (Auto-renew ongoing cycle)</option>
          <option value="Auto-Close">Auto-Close (Terminates when cycle ends)</option>
          <option value="Early-Close">Early-Close (Allows early customer cancellation)</option>
          <option value="Pause">Pause (Suspends billing cycle)</option>
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Available From"
            type="date"
            value={formData.available_from}
            onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
            required
          />

          <Input
            label="Available To (Optional)"
            type="date"
            value={formData.available_to}
            onChange={(e) => setFormData({ ...formData, available_to: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="plan-active-checkbox"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
          />
          <label htmlFor="plan-active-checkbox" className="text-xs text-[var(--color-ink)] font-medium">
            Plan is active and available for subscriptions
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save Plan
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
