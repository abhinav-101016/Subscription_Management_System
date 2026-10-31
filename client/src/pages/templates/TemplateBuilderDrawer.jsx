import React, { useState, useEffect } from 'react';
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

export function TemplateBuilderDrawer({ open, onClose, onSave, initialData }) {
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [lines, setLines] = useState([
    { product_variant_id: '', quantity: 1, unit_price: 100 },
  ]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const { data: plans = [] } = useQuery({
    queryKey: ['plans-list'],
    queryFn: async () => {
      const res = await api.get('/api/plans');
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPlanId(initialData.default_plan_id?._id || initialData.default_plan_id || initialData.plan_id?._id || initialData.plan_id || '');
      setValidityDays(initialData.validity_days || 30);
      const rawLines = initialData.template_lines || initialData.lines || [];
      if (rawLines.length > 0) {
        setLines(
          rawLines.map((l) => ({
            product_variant_id: l.product_variant_id?._id || l.product_variant_id || l.variant_id || '',
            quantity: l.default_quantity || l.quantity || 1,
            unit_price: l.unit_price || 100,
          }))
        );
      }
    } else {
      setName('');
      setPlanId(plans[0]?._id || '');
      setValidityDays(30);
      setLines([{ product_variant_id: '', quantity: 1, unit_price: 100 }]);
    }
  }, [initialData, open, plans]);

  const handleAddLine = () => {
    setLines([...lines, { product_variant_id: '', quantity: 1, unit_price: 100 }]);
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
    if (!name.trim()) {
      toast.warning('Template name is required');
      return;
    }
    const targetPlan = planId || plans[0]?._id;
    if (!targetPlan) {
      toast.warning('Please select a default plan configuration');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        default_plan_id: targetPlan,
        validity_days: Number(validityDays) || 30,
        template_lines: lines.map((l) => ({
          product_variant_id: l.product_variant_id || undefined,
          default_quantity: Number(l.quantity) || 1,
        })),
        lines: lines.map((l) => ({
          product_variant_id: l.product_variant_id || undefined,
          quantity: Number(l.quantity) || 1,
          unit_price: Number(l.unit_price) || 0,
        })),
      };

      await onSave(payload);
      toast.success(initialData ? 'Quotation template updated' : 'Quotation template created');
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
      title={initialData ? 'Edit Quotation Template' : 'New Quotation Template'}
      description="Define standardized packages and contract lines for instant customer proposal generation."
      width="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Template Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Enterprise Foundation Tier"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Default Plan"
            value={planId || (plans[0]?._id || '')}
            onChange={(e) => setPlanId(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.billing_frequency})
              </option>
            ))}
          </Select>

          <Input
            label="Validity (Days)"
            type="number"
            min="1"
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value)}
            required
          />
        </div>

        {/* Lines Builder */}
        <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase font-mono tracking-wider text-[var(--color-ink-muted)]">
              Bundled Product Lines
            </span>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={handleAddLine}
              icon={Plus}
            >
              Add Item
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
                    label="Default Qty"
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
                      <span className="text-[var(--color-ink-muted)] block text-[10px]">Est. Subtotal</span>
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

        <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between">
          <span className="text-xs uppercase font-mono text-[var(--color-ink-muted)]">
            Estimated Template Value
          </span>
          <MoneyText amount={estimatedTotal} className="text-lg font-serif-display text-[var(--color-ink)]" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save Template
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
