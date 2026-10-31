import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Play, Copy, ArrowRight } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { ResourcePicker } from '../../components/ui/ResourcePicker';
import { TemplateBuilderDrawer } from './TemplateBuilderDrawer';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';

export default function TemplatesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedTemplateForSub, setSelectedTemplateForSub] = useState(null);
  const [customerIdForSub, setCustomerIdForSub] = useState('');
  const [isInstantiateDialogOpen, setIsInstantiateDialogOpen] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // 1. Fetch Templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates-list'],
    queryFn: async () => {
      const res = await api.get('/api/templates');
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/templates', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates-list'] });
      toast.success('Quotation template saved');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save template');
    },
  });

  // Instantiate subscription from template mutation
  const instantiateMutation = useMutation({
    mutationFn: async ({ template_id, customer_id }) => {
      return await api.post('/api/subscriptions/from-template', {
        template_id,
        customer_id,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      toast.success('Draft contract initialized from quotation template');
      setIsInstantiateDialogOpen(false);
      const subId = data?._id || data?.data?._id || data?.id;
      if (subId) {
        navigate(`/app/subscriptions/${subId}`);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to instantiate subscription');
    },
  });

  const handleOpenInstantiate = (template, e) => {
    e.stopPropagation();
    setSelectedTemplateForSub(template);
    setCustomerIdForSub('');
    setIsInstantiateDialogOpen(true);
  };

  const handleConfirmInstantiate = () => {
    if (!customerIdForSub) {
      toast.warning('Please select a customer account');
      return;
    }
    instantiateMutation.mutate({
      template_id: selectedTemplateForSub._id,
      customer_id: customerIdForSub,
    });
  };

  return (
    <div className="space-y-6 text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="font-serif-display text-3xl font-normal tracking-tight">
            Quotation Templates
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-0.5">
            Standardized multi-line packages for instant 1-click subscription generation.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingTemplate(null);
            setIsDrawerOpen(true);
          }}
          icon={Plus}
        >
          New Template
        </Button>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-mono">
            Loading quotation templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-muted)] space-y-3">
            <p>No quotation templates defined yet.</p>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setEditingTemplate(null);
                setIsDrawerOpen(true);
              }}
            >
              Build First Template
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] font-mono uppercase text-[10px] text-[var(--color-ink-muted)]">
                <tr>
                  <th className="py-2.5 px-6">Template Name</th>
                  <th className="py-2.5 px-4">Default Plan</th>
                  <th className="py-2.5 px-4">Validity</th>
                  <th className="py-2.5 px-4 text-right">Items Included</th>
                  <th className="py-2.5 px-6 text-right">Instant Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {templates.map((tmpl) => {
                  const lineCount = (tmpl.template_lines || tmpl.lines || []).length;
                  return (
                    <tr key={tmpl._id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                      <td className="py-3 px-6 font-medium text-[var(--color-ink)]">
                        {tmpl.name}
                      </td>

                      <td className="py-3 px-4 font-mono text-[var(--color-ink-muted)]">
                        {tmpl.default_plan_id?.name || tmpl.plan_id?.name || 'Standard Tier'}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {tmpl.validity_days || 30} days
                      </td>

                      <td className="py-3 px-4 text-right font-num font-medium">
                        {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                      </td>

                      <td className="py-3 px-6 text-right">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={(e) => handleOpenInstantiate(tmpl, e)}
                          icon={Play}
                        >
                          Generate Contract
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Template Builder Drawer */}
      <TemplateBuilderDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialData={editingTemplate}
        onSave={async (payload) => {
          await saveMutation.mutateAsync(payload);
        }}
      />

      {/* Instantiate Subscription Modal */}
      <Dialog
        open={isInstantiateDialogOpen}
        onClose={() => setIsInstantiateDialogOpen(false)}
        title="Create Subscription from Template"
        description={`Initialize a new contract based on ${selectedTemplateForSub?.name || 'template'}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <ResourcePicker
            type="customer"
            value={customerIdForSub}
            onChange={setCustomerIdForSub}
            label="Assign Customer Account"
          />

          <div className="p-3 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] text-xs text-[var(--color-ink-muted)] space-y-1">
            <div className="flex justify-between font-mono">
              <span>Default Plan:</span>
              <span className="font-semibold text-[var(--color-ink)]">
                {selectedTemplateForSub?.default_plan_id?.name || selectedTemplateForSub?.plan_id?.name || 'Configured Plan'}
              </span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Lines:</span>
              <span>{(selectedTemplateForSub?.template_lines || selectedTemplateForSub?.lines || []).length} items bundled</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsInstantiateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={instantiateMutation.isPending}
              onClick={handleConfirmInstantiate}
            >
              Generate Draft Contract
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
