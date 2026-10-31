import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus, Search, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { MoneyText } from '../../components/ui/MoneyText';
import { DateText } from '../../components/ui/DateText';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { truncateId } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchPaymentsAndInvoices = async () => {
    setLoading(true);
    try {
      const [payData, invData] = await Promise.all([
        apiRequest('/api/payments'),
        apiRequest('/api/invoices'),
      ]);
      setPayments(payData || []);
      setInvoices(invData || []);
    } catch (err) {
      toast.error('Failed to load payments ledger', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndInvoices();
  }, []);

  const handleOpenRecordModal = () => {
    // Pick the first unpaid invoice as default
    const unpaid = invoices.find((inv) => inv.amount_due > 0 || inv.status !== 'Paid');
    if (!unpaid) {
      toast.info('All current invoices are already settled! Showing latest invoice.');
      setSelectedInvoice(invoices[0] || null);
    } else {
      setSelectedInvoice(unpaid);
    }
    setIsRecordModalOpen(true);
  };

  const filteredPayments = payments.filter((p) => {
    const invNum = p.invoice_id?.invoice_number || '';
    const note = p.notes || '';
    const method = p.method || '';
    const q = searchQuery.toLowerCase();
    return invNum.toLowerCase().includes(q) || note.toLowerCase().includes(q) || method.toLowerCase().includes(q);
  });

  const totalCollected = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const columns = [
    {
      header: 'Payment Ref',
      key: '_id',
      sortable: true,
      render: (row) => (
        <span className="font-num text-xs font-medium text-[var(--color-ink)]">
          {truncateId(row._id, 8, 4)}
        </span>
      ),
    },
    {
      header: 'Invoice #',
      key: 'invoice',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (row.invoice_id?._id || row.invoice_id) {
              navigate(`/invoices/${row.invoice_id._id || row.invoice_id}`);
            }
          }}
          className="font-num font-semibold text-xs text-[#0D4A38] dark:text-[#15805D] hover:underline"
        >
          {row.invoice_id?.invoice_number || 'Direct Ledger Credit'}
        </button>
      ),
    },
    {
      header: 'Method',
      key: 'method',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] text-xs font-medium">
          <CreditCard className="w-3 h-3 text-[var(--color-ink-muted)]" />
          {row.method}
        </span>
      ),
    },
    {
      header: 'Date Settled',
      key: 'payment_date',
      sortable: true,
      render: (row) => <DateText date={row.payment_date} format="medium" />,
    },
    {
      header: 'Reference Note',
      key: 'notes',
      render: (row) => (
        <span className="text-[var(--color-ink-muted)] truncate max-w-xs block">
          {row.notes || '—'}
        </span>
      ),
    },
    {
      header: 'Settled Amount',
      key: 'amount',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-right block text-[#15805D] font-num">
          +<MoneyText amount={row.amount} />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Payment Reconciliation Ledger
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Tracks incoming cash flows, automatic status promotions to Paid, and transaction records.
          </p>
        </div>

        <Button onClick={handleOpenRecordModal} icon={Plus}>
          Record Payment
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <span className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wider">
            Total Reconciled
          </span>
          <div className="font-num text-2xl font-semibold text-[var(--color-ink)] mt-1">
            <MoneyText amount={totalCollected} />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <span className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wider">
            Reconciled Transactions
          </span>
          <div className="font-num text-2xl font-semibold text-[var(--color-ink)] mt-1">
            {payments.length}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <span className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wider">
            Settlement Status
          </span>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#15805D] mt-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>MongoDB Ledger Synced</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex justify-end">
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[#0D4A38] dark:focus:border-[#15805D]"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        loading={loading}
        emptyTitle="No payments recorded"
        emptyDescription="Record manual wire, check, or credit card settlements to reconcile invoices."
      />

      {/* Record Payment Dialog */}
      {selectedInvoice && (
        <RecordPaymentDialog
          open={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          invoice={selectedInvoice}
          onPaymentRecorded={() => fetchPaymentsAndInvoices()}
        />
      )}
    </div>
  );
}
