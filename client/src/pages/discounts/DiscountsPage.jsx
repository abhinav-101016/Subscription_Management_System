import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Percent, Tag, Check } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { MoneyText } from '../../components/ui/MoneyText';
import { DiscountDrawer } from './DiscountDrawer';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

export default function DiscountsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: discounts = [], isLoading } = useQuery({
    queryKey: ['discounts-list'],
    queryFn: async () => {
      const res = await api.get('/api/discounts');
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ payload, id }) => {
      if (id) {
        return await api.patch(`/api/discounts/${id}`, payload);
      }
      return await api.post('/api/discounts', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts-list'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }) => {
      return await api.patch(`/api/discounts/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts-list'] });
      toast.success('Discount active state updated');
    },
  });

  const handleEdit = (d) => {
    setEditingDiscount(d);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setEditingDiscount(null);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Discount Rules & Deductions
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Configure percentage and fixed price promotional reductions applied at billing.
          </p>
        </div>

        <Button variant="primary" onClick={handleCreate} icon={Plus}>
          New Discount Rule
        </Button>
      </div>

      {/* Ruled Dense Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-mono">
            Loading discount rules...
          </div>
        ) : discounts.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-muted)] space-y-3">
            <p>No discount rules configured yet.</p>
            <Button variant="secondary" size="xs" onClick={handleCreate}>
              Create a Discount
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                <tr>
                  <th className="py-2.5 px-6">Rule Code / Name</th>
                  <th className="py-2.5 px-4">Type & Value</th>
                  <th className="py-2.5 px-4">Applicability Scope</th>
                  <th className="py-2.5 px-4">Usage Progress</th>
                  <th className="py-2.5 px-4">Active</th>
                  <th className="py-2.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {discounts.map((d) => {
                  const used = d.times_used || 0;
                  const limit = d.usage_limit || 100;
                  const percentUsed = Math.min(100, Math.round((used / limit) * 100));

                  return (
                    <tr key={d._id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                      <td className="py-3 px-6">
                        <span className="font-mono font-bold text-[var(--color-ink)] block">
                          {d.name}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--color-ink-faint)]">
                          Valid: {formatDate(d.valid_from, 'short')} – {d.valid_to ? formatDate(d.valid_to, 'short') : 'Perpetual'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold">
                        {d.type === 'Percentage' ? `${d.value}%` : formatCurrency(d.value)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                          {d.applicability === 'Specific_Product' ? 'Specific Product' : 'Whole Contract'}
                        </span>
                      </td>

                      {/* Usage Progress Bar */}
                      <td className="py-3 px-4 w-48">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-[var(--color-ink-muted)]">
                            <span>{used} used</span>
                            <span>{limit} max</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] overflow-hidden">
                            <div
                              style={{ width: `${percentUsed}%` }}
                              className={`h-full ${percentUsed >= 100 ? 'bg-[var(--color-accent)]' : 'bg-emerald-600'}`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: d._id, active: !d.active })}
                          className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border transition-colors ${
                            d.active !== false
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'border-[var(--color-border)] text-[var(--color-ink-faint)] bg-[var(--color-canvas)]'
                          }`}
                        >
                          {d.active !== false ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => handleEdit(d)}
                          className="text-xs text-[var(--color-accent)] hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DiscountDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialData={editingDiscount}
        onSave={async (payload, id) => {
          await saveMutation.mutateAsync({ payload, id });
        }}
      />
    </div>
  );
}
