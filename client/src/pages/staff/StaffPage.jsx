import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Dialog } from '../../components/ui/Dialog';
import { DateText } from '../../components/ui/DateText';
import { useAuth } from '../../features/auth/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function StaffPage() {
  const { isAdmin } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/admin/staff');
      // Some endpoints return { staff: [...] } or direct array
      const list = response?.staff || response || [];
      setStaffList(list);
    } catch (err) {
      toast.error('Failed to load internal staff directory', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
    }
  }, [isAdmin]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await apiRequest('/api/admin/staff', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setStaffList([created, ...staffList]);
      toast.success(`Staff member "${formData.name}" invited successfully`);
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
    } catch (err) {
      toast.error(err.message || 'Failed to create staff member', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="py-16 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-base font-semibold text-[var(--color-ink)]">
          Admin Privilege Required
        </h2>
        <p className="text-xs text-[var(--color-ink-muted)] max-w-sm mx-auto">
          Staff governance and role assignment is restricted strictly to users with the Administrator role.
        </p>
      </div>
    );
  }

  const columns = [
    {
      header: 'Team Member',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-xs text-[var(--color-ink)]">{row.name}</div>
          <div className="text-[11px] text-[var(--color-ink-muted)]">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      key: 'role',
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${
            row.role === 'admin'
              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
              : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
          }`}
        >
          <Shield className="w-3 h-3" />
          {row.role}
        </span>
      ),
    },
    {
      header: 'Joined Date',
      key: 'createdAt',
      sortable: true,
      render: (row) => <DateText date={row.createdAt || new Date()} format="medium" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Staff & Internal Governance
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Manage administrative personnel, role authorizations, and audit scopes.
          </p>
        </div>

        <Button onClick={() => setIsDialogOpen(true)} icon={Plus}>
          Add Team Member
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={staffList}
        loading={loading}
        emptyTitle="No staff registered"
        emptyDescription="Add internal operators to collaborate on billing cycles and subscriptions."
      />

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Invite Internal Staff Member"
        description="Creates an authorized account with scoped operational permissions."
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Julian Hayes"
          />

          <Input
            label="Internal Work Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="julian@cadence.io"
          />

          <Input
            label="Temporary Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="••••••••"
          />

          <Select
            label="Role Authorization"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="staff">Staff Operator (Subscriptions, Invoices, Billing)</option>
            <option value="admin">Administrator (Full System & Tax Authority)</option>
          </Select>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Issue Invitation
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

