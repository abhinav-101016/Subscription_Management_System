import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Shield, Check, AlertCircle } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../features/auth/AuthContext';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../lib/utils';

export default function StaffPage() {
  const { role } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    department: 'Billing & Operations',
  });
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['admin-staff-list'],
    queryFn: async () => {
      const res = await api.get('/api/admin/staff');
      const list = res?.staff || (Array.isArray(res) ? res : res?.data || []);
      return list;
    },
    enabled: role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/admin/staff', payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-list'] });
      toast.success('Staff account provisioned');
      setIsDialogOpen(false);
      setForm({ name: '', email: '', password: '', role: 'staff', department: 'Billing & Operations' });
    },
    onError: (err) => {
      setError(err.message || 'Failed to create staff member');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    createMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      department: form.department,
    });
  };

  return (
    <div className="space-y-6 text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Staff Directory & Governance
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Internal operators with access to contracts, invoices, and billing actions.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsDialogOpen(true)} icon={Plus}>
          Add Staff Member
        </Button>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-mono">
            Loading staff directory...
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-muted)] space-y-3">
            <p>No internal staff accounts registered.</p>
            <Button variant="secondary" size="xs" onClick={() => setIsDialogOpen(true)}>
              Provision First Account
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                <tr>
                  <th className="py-2.5 px-6">Staff Member</th>
                  <th className="py-2.5 px-4">Identifier / Login</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Access Role</th>
                  <th className="py-2.5 px-6 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {staffList.map((member) => (
                  <tr key={member._id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-3 px-6">
                      <span className="font-medium text-[var(--color-ink)] block">
                        {member.name}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--color-ink-faint)]">
                        {member.email}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-[var(--color-ink-muted)]">
                      {member.staffId || member.loginId || member._id.slice(-8)}
                    </td>

                    <td className="py-3 px-4 font-ui text-[var(--color-ink)]">
                      {member.department || 'Operations'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)] font-semibold">
                        {member.role || 'staff'}
                      </span>
                    </td>

                    <td className="py-3 px-6 text-right font-mono text-[var(--color-ink-muted)]">
                      {formatDate(member.createdAt, 'short')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision Account Modal */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Provision Internal Operator"
        description="Create internal credential for administrative and operations personnel."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-tint)] text-xs text-[var(--color-accent)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Robert Taylor"
            required
            autoFocus
          />

          <Input
            label="Company Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="robert@cadence.io"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="staff">Staff Operator</option>
              <option value="admin">Super Admin</option>
            </Select>

            <Input
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Finance"
              required
            />
          </div>

          <Input
            label="Initial Temporary Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Min. 8 characters"
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createMutation.isPending}>
              Create Operator Account
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
