import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Percent, Tag, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { DateText } from '../../components/ui/DateText';
import { MoneyText } from '../../components/ui/MoneyText';
import { DiscountDrawer } from './DiscountDrawer';
import { useToast } from '../../hooks/useToast';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const toast = useToast();

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/discounts');
      setDiscounts(data || []);
    } catch (err) {
      toast.error('Unable to retrieve discount rules', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleSaveDiscount = async (payload, id) => {
    if (id) {
      const updated = await apiRequest(`/api/discounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setDiscounts(discounts.map((d) => (d._id === id ? updated : d)));
    } else {
      const created = await apiRequest('/api/discounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setDiscounts([created, ...discounts]);
    }
  };

  const columns = [
    {
      header: 'Rule Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-[var(--color-ink)]">
            {row.name}
          </span>
          <div className="text-[11px] text-[var(--color-ink-faint)]">
            Min amount: ${row.min_purchase_amount || 0} • Min qty: {row.min_quantity || 1}
          </div>
        </div>
      ),
    },
    {
      header: 'Value / Type',
      key: 'value',
      sortable: true,
      render: (row) => (
        <span className="font-num text-xs font-semibold text-[var(--color-ink)]">
          {row.type === 'Percentage' ? `${row.value}% Off` : `$${row.value} Off`}
        </span>
      ),
    },
    {
      header: 'Applicability',
      key: 'applicability',
      render: (row) => (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-canvas-subtle)] border border-[var(--color-border)]">
          {row.applicability === 'Whole_Subscription' ? 'Whole Subscription' : 'Target Product'}
        </span>
      ),
    },
    {
      header: 'Usage Progress',
      key: 'usage',
      render: (row) => {
        const used = row.times_used || 0;
        const limit = row.usage_limit || 100;
        const percentage = Math.min(100, Math.round((used / limit) * 100));

        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px] font-num">
              <span>{used} / {limit}</span>
              <span className="text-[var(--color-ink-faint)]">{percentage}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--color-canvas-subtle)] border border-[var(--color-border-subtle)] overflow-hidden">
              <div
                className="h-full bg-[#0D4A38] dark:bg-[#15805D] rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Validity Period',
      key: 'validity',
      render: (row) => (
        <div className="text-xs">
          <DateText date={row.valid_from} format="short" />
          <span className="text-[var(--color-ink-faint)] mx-1">→</span>
          {row.valid_to ? (
            <DateText date={row.valid_to} format="short" />
          ) : (
            <span className="text-[var(--color-ink-faint)] italic">No expiry</span>
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
          onClick={() => {
            setEditingDiscount(row);
            setIsDrawerOpen(true);
          }}
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
            Discount Rules Engine
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Automated constraints: usage caps, threshold amounts, product targets, and validity windows.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingDiscount(null);
            setIsDrawerOpen(true);
          }}
          icon={Plus}
        >
          New Discount Rule
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={discounts}
        loading={loading}
        onRowClick={(row) => {
          setEditingDiscount(row);
          setIsDrawerOpen(true);
        }}
        emptyTitle="No discount rules defined"
        emptyDescription="Create custom incentives to apply against automated recurring invoices."
      />

      <DiscountDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveDiscount}
        initialData={editingDiscount}
      />
    </div>
  );
}
