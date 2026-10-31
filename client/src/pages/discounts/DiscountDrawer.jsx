import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ResourcePicker } from '../../components/ui/ResourcePicker';
import { useToast } from '../../hooks/useToast';
import { AlertCircle } from 'lucide-react';

export function DiscountDrawer({ open, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Percentage',
    value: 10,
    min_purchase_amount: 0,
    min_quantity: 1,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_to: '',
    usage_limit: 100,
    applicability: 'Whole_Subscription',
    applicable_product_id: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'Percentage',
        value: initialData.value || 0,
        min_purchase_amount: initialData.min_purchase_amount || 0,
        min_quantity: initialData.min_quantity || 1,
        valid_from: initialData.valid_from ? initialData.valid_from.slice(0, 10) : new Date().toISOString().slice(0, 10),
        valid_to: initialData.valid_to ? initialData.valid_to.slice(0, 10) : '',
        usage_limit: initialData.usage_limit || 100,
        applicability: initialData.applicability || 'Whole_Subscription',
        applicable_product_id: initialData.applicable_product_id?._id || initialData.applicable_product_id || '',
        active: initialData.active !== undefined ? initialData.active : true,
      });
    } else {
      setFormData({
        name: '',
        type: 'Percentage',
        value: 10,
        min_purchase_amount: 0,
        min_quantity: 1,
        valid_from: new Date().toISOString().slice(0, 10),
        valid_to: '',
        usage_limit: 100,
        applicability: 'Whole_Subscription',
        applicable_product_id: '',
        active: true,
      });
    }
    setError('');
  }, [initialData, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numVal = Number(formData.value);
    if (formData.type === 'Percentage' && numVal > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }
    if (numVal < 0) {
      setError('Discount value cannot be negative');
      return;
    }

    if (formData.applicability === 'Specific_Product' && !formData.applicable_product_id) {
      setError('Please select an applicable product variant');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        value: numVal,
        min_purchase_amount: Number(formData.min_purchase_amount) || 0,
        min_quantity: Number(formData.min_quantity) || 1,
        usage_limit: Number(formData.usage_limit) || 100,
        applicable_product_id: formData.applicability === 'Specific_Product' ? formData.applicable_product_id : undefined,
        valid_to: formData.valid_to ? formData.valid_to : null,
      };

      await onSave(payload, initialData?._id);
      toast.success(initialData ? 'Discount rule updated' : 'Discount rule created');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save discount rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Discount Rule' : 'New Discount Rule'}
      description="Define percentage or fixed reduction constraints, limits, and product eligibility."
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] flex items-center gap-2 text-xs text-[var(--color-accent)] font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Rule Name / Code"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
          placeholder="e.g. Q4_ENTERPRISE_10"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Discount Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="Percentage">Percentage (%)</option>
            <option value="Fixed">Fixed Currency Amount</option>
          </Select>

          <Input
            label={formData.type === 'Percentage' ? 'Rate (%)' : 'Amount'}
            type="number"
            min="0"
            max={formData.type === 'Percentage' ? 100 : undefined}
            step="0.01"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            required
          />
        </div>

        <Select
          label="Applicability Scope"
          value={formData.applicability}
          onChange={(e) => setFormData({ ...formData, applicability: e.target.value })}
        >
          <option value="Whole_Subscription">Whole Subscription Total</option>
          <option value="Specific_Product">Specific Product Line</option>
        </Select>

        {/* Applicability Reveal when Specific_Product selected */}
        {formData.applicability === 'Specific_Product' && (
          <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <ResourcePicker
              type="variant"
              value={formData.applicable_product_id}
              onChange={(val) => setFormData({ ...formData, applicable_product_id: val })}
              label="Select Eligible Product Variant"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min Purchase Amount"
            type="number"
            min="0"
            value={formData.min_purchase_amount}
            onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
          />

          <Input
            label="Usage Limit"
            type="number"
            min="1"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valid From"
            type="date"
            value={formData.valid_from}
            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            required
          />

          <Input
            label="Valid To (Optional)"
            type="date"
            value={formData.valid_to}
            onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="discount-active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="rounded border-[var(--color-border)] text-[var(--color-accent)]"
          />
          <label htmlFor="discount-active" className="text-xs text-[var(--color-ink)] font-medium">
            Rule is active and will evaluate during billing
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save Rule
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
