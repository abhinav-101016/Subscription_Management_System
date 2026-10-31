import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ResourcePicker } from '../../components/ui/ResourcePicker';
import { useToast } from '../../hooks/useToast';

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
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'Percentage',
        value: initialData.value || 0,
        min_purchase_amount: initialData.min_purchase_amount || 0,
        min_quantity: initialData.min_quantity || 1,
        valid_from: initialData.valid_from ? initialData.valid_from.slice(0, 10) : '',
        valid_to: initialData.valid_to ? initialData.valid_to.slice(0, 10) : '',
        usage_limit: initialData.usage_limit || 100,
        applicability: initialData.applicability || 'Whole_Subscription',
        applicable_product_id: initialData.applicable_product_id?._id || initialData.applicable_product_id || '',
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
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        value: Number(formData.value),
        min_purchase_amount: Number(formData.min_purchase_amount),
        min_quantity: Number(formData.min_quantity),
        usage_limit: Number(formData.usage_limit),
        applicable_product_id: formData.applicability === 'Specific_Product' ? formData.applicable_product_id : null,
      };

      await onSave(payload, initialData?._id);
      toast.success(initialData ? 'Discount rule updated' : 'Discount rule created');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save discount rule', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Discount Rule' : 'Create Discount Rule'}
      description="Define promotional incentives, volume gates, and usage limits."
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Rule Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g. Early Stage Startup 15% Off"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Discount Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="Percentage">Percentage (%)</option>
            <option value="Fixed">Fixed Amount ($)</option>
          </Select>

          <Input
            label={formData.type === 'Percentage' ? 'Value (%)' : 'Amount ($)'}
            type="number"
            min="0"
            max={formData.type === 'Percentage' ? 100 : undefined}
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
          <option value="Whole_Subscription">Whole Subscription (Entire subtotal)</option>
          <option value="Specific_Product">Specific Product Line Only</option>
        </Select>

        {formData.applicability === 'Specific_Product' && (
          <ResourcePicker
            type="variant"
            value={formData.applicable_product_id}
            onChange={(val) => setFormData({ ...formData, applicable_product_id: val })}
            label="Target Product Variant"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min Purchase ($)"
            type="number"
            min="0"
            value={formData.min_purchase_amount}
            onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
          />

          <Input
            label="Min Quantity"
            type="number"
            min="1"
            value={formData.min_quantity}
            onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
          />
        </div>

        <Input
          label="Usage Cap Limit"
          type="number"
          min="1"
          value={formData.usage_limit}
          onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
          helperText="Maximum times this discount can be consumed across all contracts"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valid From"
            type="date"
            value={formData.valid_from}
            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            required
          />

          <Input
            label="Valid To"
            type="date"
            value={formData.valid_to}
            onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-6 border-t border-[var(--color-border)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Discount Rule
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
