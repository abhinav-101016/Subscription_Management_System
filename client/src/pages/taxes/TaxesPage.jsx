import React, { useState, useEffect } from 'react';
import { Plus, ShieldCheck, Check, X } from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../hooks/useToast';

export default function TaxesPage() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTax, setNewTax] = useState({
    name: '',
    percentage_rate: 18,
    description: '',
    active: true,
  });
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/taxes');
      setTaxes(data || []);
    } catch (err) {
      toast.error('Failed to load tax rules', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleCreateTax = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await apiRequest('/api/taxes', {
        method: 'POST',
        body: JSON.stringify({
          ...newTax,
          percentage_rate: Number(newTax.percentage_rate),
        }),
      });
      setTaxes([created, ...taxes]);
      toast.success('Tax rule created successfully');
      setIsDialogOpen(false);
      setNewTax({ name: '', percentage_rate: 18, description: '', active: true });
    } catch (err) {
      toast.error(err.message || 'Failed to create tax rule', 'Error');
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    {
      header: 'Tax Rule Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-[var(--color-ink)]">
            {row.name}
          </span>
          <div className="text-[11px] text-[var(--color-ink-muted)]">
            {row.description || 'Jurisdictional tax compliance'}
          </div>
        </div>
      ),
    },
    {
      header: 'Rate',
      key: 'percentage_rate',
      sortable: true,
      render: (row) => (
        <span className="font-num text-xs font-semibold text-[var(--color-ink)] px-2 py-0.5 rounded bg-[var(--color-canvas-subtle)] border border-[var(--color-border)]">
          {row.percentage_rate}%
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'active',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            row.active
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20'
          }`}
        >
          {row.active ? 'Active Jurisdiction' : 'Disabled'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Tax Jurisdiction Rules
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Automated statutory tax rates applied during recurring billing generation.
          </p>
        </div>

        <Button onClick={() => setIsDialogOpen(true)} icon={Plus}>
          Add Tax Rule
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={taxes}
        loading={loading}
        emptyTitle="No tax rules configured"
        emptyDescription="Add jurisdictional rates (e.g. GST, VAT) for automated invoice calculation."
      />

      {/* Create Tax Modal */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Create Tax Jurisdiction Rule"
        description="Applied to contract line items during billing runs."
      >
        <form onSubmit={handleCreateTax} className="space-y-4">
          <Input
            label="Rule Name"
            type="text"
            value={newTax.name}
            onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
            required
            placeholder="e.g. Standard GST (Goods and Services Tax)"
          />

          <Input
            label="Statutory Rate (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={newTax.percentage_rate}
            onChange={(e) => setNewTax({ ...newTax, percentage_rate: e.target.value })}
            required
            suffix="%"
          />

          <Input
            label="Description / Compliance Code"
            type="text"
            value={newTax.description}
            onChange={(e) => setNewTax({ ...newTax, description: e.target.value })}
            placeholder="e.g. Applicable on all SaaS and software licenses"
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Save Tax Rule
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

