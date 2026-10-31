import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { DateText } from '../../components/ui/DateText';
import { MoneyText } from '../../components/ui/MoneyText';
import { SubscriptionDrawer } from './SubscriptionDrawer';
import { truncateId, cn } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/subscriptions');
      setSubscriptions(data || []);
    } catch (err) {
      toast.error('Unable to retrieve subscriptions', 'Fetch Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCreateSubscription = async (payload) => {
    const created = await apiRequest('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSubscriptions([created, ...subscriptions]);
    navigate(`/subscriptions/${created._id}`);
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (sub.status || '').toLowerCase() === statusFilter.toLowerCase();

    const customerName = sub.customer_id?.name || '';
    const subId = sub._id || '';
    const planName = sub.plan_id?.name || '';

    const matchesSearch =
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      planName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      header: 'Subscription Ref',
      key: '_id',
      sortable: true,
      render: (row) => (
        <span className="font-num text-[11px] font-medium text-[var(--color-ink)]">
          {truncateId(row._id, 8, 4)}
        </span>
      ),
    },
    {
      header: 'Customer',
      key: 'customer',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-[var(--color-ink)]">
            {row.customer_id?.name || 'Customer Record'}
          </div>
          <div className="text-[11px] text-[var(--color-ink-muted)]">
            {row.customer_id?.email || '—'}
          </div>
        </div>
      ),
    },
    {
      header: 'Plan & Billing',
      key: 'plan',
      render: (row) => (
        <div>
          <div className="font-medium text-[var(--color-ink)]">
            {row.plan_id?.name || 'Standard Plan'}
          </div>
          <div className="text-[11px] text-[var(--color-ink-faint)]">
            {row.plan_id?.billing_frequency || 'Monthly'} • Next:{' '}
            <DateText date={row.next_billing_date} format="short" />
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      header: 'Lines',
      key: 'lines',
      render: (row) => (
        <span className="font-num text-[var(--color-ink-muted)]">
          {row.lines?.length || 1} line item{row.lines?.length > 1 ? 's' : ''}
        </span>
      ),
    },
    {
      header: 'Start Date',
      key: 'start_date',
      sortable: true,
      render: (row) => <DateText date={row.start_date} format="short" />,
    },
  ];

  const statusTabs = ['ALL', 'Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Subscription Contracts
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            State-machine enforced lifecycle: Draft → Quotation → Confirmed → Active → Closed.
          </p>
        </div>

        <Button onClick={() => setIsDrawerOpen(true)} icon={Plus}>
          New Subscription
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors',
                statusFilter === tab
                  ? 'bg-[var(--color-canvas-subtle)] text-[var(--color-ink)] font-semibold shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscriptions..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[#0D4A38] dark:focus:border-[#15805D]"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSubscriptions}
        loading={loading}
        onRowClick={(row) => navigate(`/subscriptions/${row._id}`)}
        emptyTitle="No subscriptions matching filter"
        emptyDescription="Create your first contract draft to initiate the state machine."
      />

      {/* Subscription Drawer Modal */}
      <SubscriptionDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCreated={handleCreateSubscription}
      />
    </div>
  );
}
