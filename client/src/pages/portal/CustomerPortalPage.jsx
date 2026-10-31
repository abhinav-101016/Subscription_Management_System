import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Receipt,
  Repeat,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { MoneyText } from '../../components/ui/MoneyText';
import { DateText } from '../../components/ui/DateText';
import { RecordPaymentDialog } from '../payments/RecordPaymentDialog';
import { useAuth } from '../../features/auth/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function CustomerPortalPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const [subs, invs] = await Promise.all([
        apiRequest('/api/subscriptions'),
        apiRequest('/api/invoices'),
      ]);
      setSubscriptions(subs || []);
      setInvoices(invs || []);
    } catch (err) {
      toast.error('Failed to load customer portal', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const unpaidInvoices = invoices.filter(
    (inv) => inv.status !== 'Paid' && (inv.amount_due === undefined || inv.amount_due > 0)
  );

  const handlePayNow = (inv) => {
    setSelectedInvoice(inv);
    setIsPayModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Hero */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-[#15805D] text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Customer Account</span>
          </div>
          <h1 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Welcome back, {user?.name || 'Valued Partner'}
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] max-w-lg leading-relaxed">
            Manage your enterprise contracts, view recurring billing statements, and settle balances via ACH or credit card.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--color-canvas)] border border-[var(--color-border)] min-w-[200px]">
          <span className="text-[11px] uppercase tracking-wider text-[var(--color-ink-faint)] font-semibold">
            Unpaid Receivables
          </span>
          <div className="font-num text-2xl font-semibold text-[var(--color-ink)] mt-1">
            <MoneyText
              amount={unpaidInvoices.reduce((acc, i) => acc + (i.amount_due || i.grand_total), 0)}
            />
          </div>
          <span className="text-xs text-[var(--color-ink-muted)] mt-0.5 block">
            {unpaidInvoices.length} outstanding invoice{unpaidInvoices.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Outstanding Invoices Alert Card */}
      {unpaidInvoices.length > 0 && (
        <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                Statements Awaiting Settlement
              </h2>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Due immediately
            </span>
          </div>

          <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] overflow-hidden">
            {unpaidInvoices.map((inv) => (
              <div
                key={inv._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-num font-semibold text-xs text-[var(--color-ink)]">
                      {inv.invoice_number}
                    </span>
                    <StatusPill status={inv.status} />
                  </div>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                    Due date: <DateText date={inv.due_date} />
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[var(--color-ink)] block">
                      <MoneyText amount={inv.amount_due ?? inv.grand_total} />
                    </span>
                    <span className="text-[10px] text-[var(--color-ink-faint)]">
                      Balance Due
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handlePayNow(inv)}
                    icon={CreditCard}
                  >
                    Pay Balance
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Subscriptions Section */}
      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              Your Recurring Contracts
            </h2>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Current subscription services and automated renewal terms.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => (
            <div
              key={sub._id}
              onClick={() => navigate(`/subscriptions/${sub._id}`)}
              className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)]/50 hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[var(--color-ink)]">
                  {sub.plan_id?.name || 'Enterprise Service Tier'}
                </span>
                <StatusPill status={sub.status} />
              </div>

              <div className="text-xs text-[var(--color-ink-muted)] space-y-1">
                <div className="flex justify-between">
                  <span>Frequency:</span>
                  <span className="font-medium text-[var(--color-ink)]">
                    {sub.plan_id?.billing_frequency || 'Monthly'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Next Renewal:</span>
                  <DateText date={sub.next_billing_date} className="font-medium text-[var(--color-ink)]" />
                </div>
                <div className="flex justify-between">
                  <span>Contract Lines:</span>
                  <span>{sub.lines?.length || 1} active seat(s)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement Dialog */}
      {selectedInvoice && (
        <RecordPaymentDialog
          open={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          invoice={selectedInvoice}
          onPaymentRecorded={() => fetchPortalData()}
        />
      )}
    </div>
  );
}
