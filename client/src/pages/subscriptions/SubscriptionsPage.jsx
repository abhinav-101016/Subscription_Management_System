import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Copy, Check, ExternalLink } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { MoneyText } from '../../components/ui/MoneyText';
import { SubscriptionDrawer } from './SubscriptionDrawer';
import { cn, formatDate } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

export default function SubscriptionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const statusTab = searchParams.get('status') || 'ALL';
  const searchQuery = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 15;

  const { data: subscriptions = [], isLoading, error } = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: async () => {
      const res = await api.get('/api/subscriptions');
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/subscriptions', payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      toast.success('Contract created in Draft status');
      const targetId = data?._id || data?.data?._id || data?.id;
      if (targetId) {
        navigate(`/app/subscriptions/${targetId}`);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create subscription contract');
    },
  });

  const setStatusTab = (tab) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', tab);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearchChange = (val) => {
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleCopy = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Filter subscriptions
  const filtered = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchStatus =
        statusTab === 'ALL' || (sub.status || '').toLowerCase() === statusTab.toLowerCase();

      const q = searchQuery.toLowerCase();
      const customerName = sub.customer_id?.name || '';
      const customerEmail = sub.customer_id?.email || '';
      const subNum = sub.subscription_number || '';
      const planName = sub.plan_id?.name || '';

      const matchQuery =
        !q ||
        customerName.toLowerCase().includes(q) ||
        customerEmail.toLowerCase().includes(q) ||
        subNum.toLowerCase().includes(q) ||
        planName.toLowerCase().includes(q);

      return matchStatus && matchQuery;
    });
  }, [subscriptions, statusTab, searchQuery]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Subscription Contracts
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Recurring contract lifecycle, state progression, and billing triggers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={() => setIsDrawerOpen(true)} icon={Plus}>
            New Contract
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-xs overflow-x-auto">
          {['ALL', 'Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={cn(
                'px-3 py-1 rounded text-xs font-mono font-medium transition-colors whitespace-nowrap',
                statusTab === tab
                  ? 'bg-[var(--color-ink)] text-[var(--color-canvas)] shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--color-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by contract #, customer, plan..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] placeholder-[var(--color-ink-faint)] focus:outline-hidden focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Ruled Dense Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-mono">
            Loading recurring contract ledger...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-[var(--color-ink-muted)]">
              No subscription contracts match the selected status filter or query.
            </p>
            <Button variant="secondary" size="xs" onClick={() => setIsDrawerOpen(true)}>
              Initialize First Contract
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                <tr>
                  <th className="py-2.5 px-6">Contract Number</th>
                  <th className="py-2.5 px-4">Customer Account</th>
                  <th className="py-2.5 px-4">Plan & Frequency</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Start Date</th>
                  <th className="py-2.5 px-4 text-right">Lines</th>
                  <th className="py-2.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {paginated.map((sub) => {
                  const lineCount = sub.lines?.length || 0;
                  return (
                    <tr
                      key={sub._id}
                      onClick={() => navigate(`/app/subscriptions/${sub._id}`)}
                      className="hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors group"
                    >
                      {/* Contract Number as Primary Label */}
                      <td className="py-3 px-6">
                        <div className="font-mono font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                          {sub.subscription_number || 'SUB-DRAFT'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--color-ink-faint)]">
                          <span>{sub._id.slice(-8)}</span>
                          <button
                            onClick={(e) => handleCopy(sub._id, e)}
                            title="Copy ObjectId"
                            className="hover:text-[var(--color-ink)]"
                          >
                            {copiedId === sub._id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium truncate max-w-[160px] text-[var(--color-ink)]">
                          {sub.customer_id?.name || 'Customer Account'}
                        </div>
                        <div className="text-[10px] text-[var(--color-ink-faint)] font-mono truncate max-w-[160px]">
                          {sub.customer_id?.email || '—'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-[var(--color-ink)]">
                          {sub.plan_id?.name || 'Standard Plan'}
                        </div>
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                          {sub.plan_id?.billing_frequency || 'Monthly'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <StatusPill status={sub.status} />
                      </td>

                      <td className="py-3 px-4 font-mono text-[var(--color-ink-muted)]">
                        {formatDate(sub.start_date, 'short')}
                      </td>

                      <td className="py-3 px-4 text-right font-num font-medium">
                        {lineCount} {lineCount === 1 ? 'item' : 'items'}
                      </td>

                      <td className="py-3 px-6 text-right">
                        <span className="text-xs text-[var(--color-accent)] group-hover:underline font-medium inline-flex items-center gap-1">
                          Inspect <ExternalLink className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 px-6 border-t border-[var(--color-border)] bg-[var(--color-canvas)] flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
            <span>
              Page {page} of {totalPages} ({filtered.length} total contracts)
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(page - 1));
                  setSearchParams(p);
                }}
                className="px-2.5 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(page + 1));
                  setSearchParams(p);
                }}
                className="px-2.5 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Creation Drawer */}
      <SubscriptionDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCreated={async (payload) => {
          await createMutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
