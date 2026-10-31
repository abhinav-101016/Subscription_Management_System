import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Receipt, FileText } from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { MoneyText } from '../../components/ui/MoneyText';
import { DateText } from '../../components/ui/DateText';
import { truncateId, cn } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all'; // 'all' | 'outstanding' | 'paid'
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/invoices');
      setInvoices(data || []);
    } catch (err) {
      toast.error('Unable to fetch invoices', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const filteredInvoices = invoices.filter((inv) => {
    // Tab filtering
    if (activeTab === 'outstanding') {
      if (inv.status === 'Paid' || (inv.amount_due !== undefined && inv.amount_due <= 0)) {
        return false;
      }
    } else if (activeTab === 'paid') {
      if (inv.status !== 'Paid' && inv.amount_due > 0) {
        return false;
      }
    }

    // Search query filtering
    const invNum = inv.invoice_number || '';
    const custName = inv.customer_id?.name || '';
    const query = searchQuery.toLowerCase();
    return invNum.toLowerCase().includes(query) || custName.toLowerCase().includes(query);
  });

  const columns = [
    {
      header: 'Invoice #',
      key: 'invoice_number',
      sortable: true,
      render: (row) => (
        <span className="font-num font-semibold text-xs text-[var(--color-ink)]">
          {row.invoice_number}
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
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      header: 'Issue Date',
      key: 'issue_date',
      sortable: true,
      render: (row) => <DateText date={row.issue_date || row.createdAt} format="short" />,
    },
    {
      header: 'Due Date',
      key: 'due_date',
      sortable: true,
      render: (row) => {
        const isPastDue = row.due_date && new Date(row.due_date) < new Date() && row.status !== 'Paid';
        return (
          <span className={cn(isPastDue && 'text-[#B91C1C] font-semibold')}>
            <DateText date={row.due_date} format="short" />
          </span>
        );
      },
    },
    {
      header: 'Grand Total',
      key: 'grand_total',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-right block">
          <MoneyText amount={row.grand_total} />
        </span>
      ),
    },
    {
      header: 'Amount Due',
      key: 'amount_due',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'font-semibold text-right block font-num',
            row.amount_due > 0 ? 'text-[#B91C1C]' : 'text-[#15805D]'
          )}
        >
          <MoneyText amount={row.amount_due ?? 0} />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Invoices & Billing Statements
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Reconcile payments, track outstanding receivables, and print formal tax invoices.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'outstanding', label: 'Outstanding / Due' },
            { id: 'paid', label: 'Settled & Paid' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-[var(--color-canvas-subtle)] text-[var(--color-ink)] font-semibold shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice # or customer..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[#0D4A38] dark:focus:border-[#15805D]"
          />
        </div>
      </div>

      {/* Invoices Data Table */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        loading={loading}
        onRowClick={(row) => navigate(`/invoices/${row._id}`)}
        emptyTitle="No invoices matching view"
        emptyDescription="Invoices will be automatically billed on cycle or when subscriptions transition."
      />
    </div>
  );
}

