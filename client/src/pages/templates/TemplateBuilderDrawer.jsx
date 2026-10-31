import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ResourcePicker } from '../../components/ui/ResourcePicker';
import { MOCK_PLANS } from '../../lib/mocks';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export function TemplateBuilderDrawer({ open, onClose, onSave, initialData }) {
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState(MOCK_PLANS[0]?._id || '');
  const [lines, setLines] = useState([
    { product_variant_id: '672458a4e8d3570000000001', quantity: 10, unit_price: 120 },
  ]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPlanId(initialData.plan_id?._id || initialData.plan_id || MOCK_PLANS[0]?._id);
      setLines(initialData.lines?.length ? initialData.lines : [{ product_variant_id: '672458a4e8d3570000000001', quantity: 1, unit_price: 100 }]);
    } else {
      setName('');
      setPlanId(MOCK_PLANS[0]?._id || '');
      setLines([{ product_variant_id: '672458a4e8d3570000000001', quantity: 5, unit_price: 120 }]);
    }
  }, [initialData, open]);

  const handleAddLine = () => {
    setLines([...lines, { product_variant_id: '672458a4e8d3570000000002', quantity: 1, unit_price: 450 }]);
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
    setLoading(true);
    try {
      const payload = {
        name,
        plan_id: planId,
        lines: lines.map((l) => ({
          product_variant_id: l.product_variant_id?._id || l.product_variant_id,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
        })),
      };

      await onSave(payload, initialData?._id);
      toast.success(initialData ? 'Template updated' : 'Quotation template saved');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save template', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const estimatedTotal = lines.reduce((acc, l) => acc + (l.quantity * l.unit_price), 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Quotation Template' : 'Create Quotation Template'}
      description="Preconfigure line items and plans to quickly issue standard quotes."
      width="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Template Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Standard Enterprise Bundle"
        />

        <Select
          label="Linked Plan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
        >
          {MOCK_PLANS.map((plan) => (
            <option key={plan._id} value={plan._id}>
              {plan.name} ({plan.billing_frequency})
            </option>
          ))}
        </Select>

        {/* Line Items */}
        <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[var(--color-ink-muted)]">
              Preconfigured Line Items
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
                  value={line.product_variant_id?._id || line.product_variant_id}
                  onChange={(val) => handleLineChange(idx, 'product_variant_id', val)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Default Quantity"
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                  />
                  <Input
                    label="Default Unit Price ($)"
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
            <span>Template Preset Value:</span>
            <span className="font-num text-sm text-[var(--color-ink)] font-semibold">
              ${estimatedTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Template
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
