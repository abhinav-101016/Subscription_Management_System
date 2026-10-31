import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Calendar, Check, Search } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { PlanDrawer } from './PlanDrawer';
import { useToast } from '../../hooks/useToast';
import { formatDate, cn } from '../../lib/utils';

export default function PlansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const freqFilter = searchParams.get('frequency') || 'ALL';
  const activeFilter = searchParams.get('active') || 'ALL'; // 'ALL' | 'true' | 'false'

  // Fetch real plans from backend
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans-list'],
    queryFn: async () => {
      const res = await api.get('/api/plans');
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ payload, id }) => {
      if (id) {
        return await api.put(`/api/plans/${id}`, payload);
      }
      return await api.post('/api/plans', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans-list'] });
    },
  });

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val === 'ALL') p.delete(key);
    else p.set(key, val);
    setSearchParams(p);
  };

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      if (freqFilter !== 'ALL' && p.billing_frequency !== freqFilter) return false;
      if (activeFilter === 'true' && p.active === false) return false;
      if (activeFilter === 'false' && p.active !== false) return false;
      return true;
    });
  }, [plans, freqFilter, activeFilter]);

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Plan Configurations
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Billing frequencies, minimum quantities, and contract renewal behaviors.
          </p>
        </div>

        <Button variant="primary" onClick={handleCreate} icon={Plus}>
          New Plan
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--color-ink-muted)]">Frequency:</span>
          <select
            value={freqFilter}
            onChange={(e) => setFilter('frequency', e.target.value)}
            className="p-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] focus:outline-hidden"
          >
            <option value="ALL">All Frequencies</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[var(--color-ink-muted)]">Status:</span>
          <select
            value={activeFilter}
            onChange={(e) => setFilter('active', e.target.value)}
            className="p-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Dense Ruled Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-mono">
            Loading plan configurations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-muted)] space-y-3">
            <p>No plans match the selected filters.</p>
            <Button variant="secondary" size="xs" onClick={handleCreate}>
              Create a Plan
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                <tr>
                  <th className="py-2.5 px-6">Plan Name</th>
                  <th className="py-2.5 px-4">Frequency</th>
                  <th className="py-2.5 px-4">Min. Quantity</th>
                  <th className="py-2.5 px-4">Renewal Behavior</th>
                  <th className="py-2.5 px-4">Validity Range</th>
                  <th className="py-2.5 px-4">Active</th>
                  <th className="py-2.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((plan) => (
                  <tr key={plan._id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-3 px-6 font-medium text-[var(--color-ink)]">
                      {plan.name}
                    </td>

                    <td className="py-3 px-4 font-mono text-[var(--color-ink-muted)]">
                      {plan.billing_frequency}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium">
                      {plan.minimum_quantity || 1}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                        {plan.renewal_behavior || 'Renew'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[11px] font-mono text-[var(--color-ink-muted)]">
                      {formatDate(plan.available_from, 'short')} – {plan.available_to ? formatDate(plan.available_to, 'short') : 'Ongoing'}
                    </td>

                    <td className="py-3 px-4">
                      {plan.active !== false ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-semibold">Active</span>
                      ) : (
                        <span className="text-[var(--color-ink-faint)] font-mono text-[11px]">Inactive</span>
                      )}
                    </td>

                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="text-xs text-[var(--color-accent)] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PlanDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialData={editingPlan}
        onSave={async (payload, id) => {
          await saveMutation.mutateAsync({ payload, id });
        }}
      />
    </div>
  );
}
