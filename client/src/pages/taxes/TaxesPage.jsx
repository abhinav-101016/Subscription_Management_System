import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { useToast } from '../../hooks/useToast';

export default function TaxesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'true' | 'false'
  const [form, setForm] = useState({
    name: '',
    percentage_rate: 18,
    description: '',
    active: true,
  });
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: taxes = [], isLoading } = useQuery({
    queryKey: ['taxes-list'],
    queryFn: async () => {
      const res = await api.get('/api/taxes');
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/taxes', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes-list'] });
      toast.success('Statutory tax rule created');
      setIsDialogOpen(false);
      setForm({ name: '', percentage_rate: 18, description: '', active: true });
    },
    onError: (err) => {
      setError(err.message || 'Failed to create tax rule');
    },
  });

  const filtered = useMemo(() => {
    return taxes.filter((t) => {
      if (activeFilter === 'true' && t.active === false) return false;
      if (activeFilter === 'false' && t.active !== false) return false;
      return true;
    });
  }, [taxes, activeFilter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const rate = Number(form.percentage_rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Percentage rate must be between 0 and 100');
      return;
    }

    createMutation.mutate({
      name: form.name.trim(),
      percentage_rate: rate,
      description: form.description.trim() || undefined,
      active: form.active,
    });
  };

  return (
    <div className="space-y-6 text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Tax Calculation Rules
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Configure statutory sales taxes, VAT, and GST rates applied to invoice line totals.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsDialogOpen(true)} icon={Plus}>
          New Tax Rule
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-[var(--color-ink-muted)]">Status:</span>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="p-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] focus:outline-hidden"
        >
          <option value="ALL">All Tax Rules</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-mono">
            Loading tax rules...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-muted)] space-y-3">
            <p>No tax rules match the selected filter.</p>
            <Button variant="secondary" size="xs" onClick={() => setIsDialogOpen(true)}>
              Define a Tax Rule
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                <tr>
                  <th className="py-2.5 px-6">Tax Rule Name</th>
                  <th className="py-2.5 px-4">Rate Percentage</th>
                  <th className="py-2.5 px-4">Statutory Description</th>
                  <th className="py-2.5 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((tax) => (
                  <tr key={tax._id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-3 px-6 font-medium text-[var(--color-ink)]">
                      {tax.name}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-sm text-[var(--color-accent)]">
                      {tax.percentage_rate}%
                    </td>

                    <td className="py-3 px-4 text-xs text-[var(--color-ink-muted)]">
                      {tax.description || 'Statutory calculation rule'}
                    </td>

                    <td className="py-3 px-6 text-right">
                      {tax.active !== false ? (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-canvas)] text-[var(--color-ink-faint)]">
                          Disabled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Define Tax Rule"
        description="Statutory percentage applied to contract subtotal lines during billing."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] text-xs text-[var(--color-accent)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Tax Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Statutory VAT (18%)"
            required
            autoFocus
          />

          <Input
            label="Percentage Rate (0 – 100)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.percentage_rate}
            onChange={(e) => setForm({ ...form, percentage_rate: e.target.value })}
            required
          />

          <Input
            label="Statutory Description (Optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Applied to standard software service subscriptions"
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="tax-active-checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="rounded border-[var(--color-border)] text-[var(--color-accent)]"
            />
            <label htmlFor="tax-active-checkbox" className="text-xs text-[var(--color-ink)] font-medium">
              Tax rule is active and enabled for billing calculations
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createMutation.isPending}>
              Create Tax Rule
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
