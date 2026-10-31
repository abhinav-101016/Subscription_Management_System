import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../hooks/useToast';

export function PlanDrawer({ open, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    billing_frequency: 'Monthly',
    minimum_quantity: 1,
    available_from: new Date().toISOString().slice(0, 10),
    available_to: '',
    renewal_behavior: 'Renew',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        billing_frequency: initialData.billing_frequency || 'Monthly',
        minimum_quantity: initialData.minimum_quantity || 1,
        available_from: initialData.available_from ? initialData.available_from.slice(0, 10) : '',
        available_to: initialData.available_to ? initialData.available_to.slice(0, 10) : '',
        renewal_behavior: initialData.renewal_behavior || 'Renew',
      });
    } else {
      setFormData({
        name: '',
        billing_frequency: 'Monthly',
        minimum_quantity: 1,
        available_from: new Date().toISOString().slice(0, 10),
        available_to: '',
        renewal_behavior: 'Renew',
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        minimum_quantity: Number(formData.minimum_quantity),
        available_to: formData.available_to ? formData.available_to : null,
      };

      await onSave(payload, initialData?._id);
      toast.success(initialData ? 'Plan configuration updated' : 'New plan created');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save plan', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Plan Configuration' : 'Create Billing Plan'}
      description="Define contract cycles, quantity minimums, and terminal renewal behaviors."
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Plan Display Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g. Enterprise Infrastructure (Annual)"
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
          label="End of Period Renewal Behavior"
          value={formData.renewal_behavior}
          onChange={(e) => setFormData({ ...formData, renewal_behavior: e.target.value })}
          helperText="Determines how the automated billing engine processes expired terms."
        >
          <option value="Renew">Renew (Roll into new recurring cycle)</option>
          <option value="Pause">Pause (Halt generation until manual approval)</option>
          <option value="Auto-Close">Auto-Close (Transition subscription to Closed)</option>
          <option value="Early-Close">Early-Close (Grace window termination)</option>
        </Select>

        <div className="grid grid-cols-2 gap-4 pt-2">
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
            helperText="Leave empty for indefinite duration"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-6 border-t border-[var(--color-border)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Save Changes' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

