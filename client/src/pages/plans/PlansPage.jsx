import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Calendar, ShieldCheck, Check } from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { DateText } from '../../components/ui/DateText';
import { PlanDrawer } from './PlanDrawer';
import { useToast } from '../../hooks/useToast';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const toast = useToast();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/plans');
      setPlans(data || []);
    } catch (err) {
      toast.error('Failed to retrieve plans', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSavePlan = async (payload, id) => {
    if (id) {
      const updated = await apiRequest(`/api/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setPlans(plans.map((p) => (p._id === id ? updated : p)));
    } else {
      const created = await apiRequest('/api/plans', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setPlans([created, ...plans]);
    }
  };

  const handleEdit = (plan, e) => {
    e?.stopPropagation();
    setEditingPlan(plan);
    setIsDrawerOpen(true);
  };

  const columns = [
    {
      header: 'Plan Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-[var(--color-ink)]">
            {row.name}
          </span>
          <div className="text-[11px] text-[var(--color-ink-faint)]">
            Min seats: {row.minimum_quantity}
          </div>
        </div>
      ),
    },
    {
      header: 'Frequency',
      key: 'billing_frequency',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--color-canvas-subtle)] text-xs font-num font-medium border border-[var(--color-border)]">
          {row.billing_frequency}
        </span>
      ),
    },
    {
      header: 'Renewal Behavior',
      key: 'renewal_behavior',
      sortable: true,
      render: (row) => {
        const colors = {
          Renew: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
          Pause: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
          'Auto-Close': 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
          'Early-Close': 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
        };
        return (
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${colors[row.renewal_behavior] || ''}`}
          >
            {row.renewal_behavior}
          </span>
        );
      },
    },
    {
      header: 'Available Period',
      key: 'available_from',
      render: (row) => (
        <div className="text-xs">
          <DateText date={row.available_from} format="short" />
          <span className="text-[var(--color-ink-faint)] mx-1">→</span>
          {row.available_to ? (
            <DateText date={row.available_to} format="short" />
          ) : (
            <span className="text-[var(--color-ink-faint)] italic">Indefinite</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => handleEdit(row, e)}
          icon={Edit2}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Plan Configurations
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Governs contract recurring schedules, volume thresholds, and renewal policies.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingPlan(null);
            setIsDrawerOpen(true);
          }}
          icon={Plus}
        >
          Create Plan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        onRowClick={(row) => handleEdit(row)}
        emptyTitle="No plans configured"
        emptyDescription="Set up billing frequencies and renewal behaviors to start offering subscriptions."
      />

      <PlanDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSavePlan}
        initialData={editingPlan}
      />
    </div>
  );
}
