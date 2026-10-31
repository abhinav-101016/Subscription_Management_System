import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Play, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { MoneyText } from '../../components/ui/MoneyText';
import { TemplateBuilderDrawer } from './TemplateBuilderDrawer';
import { useToast } from '../../hooks/useToast';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/templates');
      setTemplates(data || []);
    } catch (err) {
      toast.error('Unable to retrieve quotation templates', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSaveTemplate = async (payload, id) => {
    if (id) {
      const updated = await apiRequest(`/api/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setTemplates(templates.map((t) => (t._id === id ? updated : t)));
    } else {
      const created = await apiRequest('/api/templates', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTemplates([created, ...templates]);
    }
  };

  // Convert template into an active subscription draft
  const handleInstantiateSubscription = async (template, e) => {
    e?.stopPropagation();
    try {
      const created = await apiRequest('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: '672458a4e8d3560000000001', // Default Acme customer
          plan_id: template.plan_id?._id || template.plan_id,
          start_date: new Date().toISOString(),
          lines: template.lines.map((l) => ({
            product_variant_id: l.product_variant_id?._id || l.product_variant_id,
            quantity: l.quantity,
            unit_price: l.unit_price,
          })),
        }),
      });

      toast.success(
        `Draft created from template "${template.name}"`,
        'Subscription Initialized'
      );
      navigate(`/subscriptions/${created._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to instantiate subscription', 'Error');
    }
  };

  const columns = [
    {
      header: 'Template Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-[var(--color-ink)]">
            {row.name}
          </span>
          <div className="text-[11px] text-[var(--color-ink-faint)]">
            {row.lines?.length || 1} preconfigured line items
          </div>
        </div>
      ),
    },
    {
      header: 'Linked Plan',
      key: 'plan',
      render: (row) => (
        <span className="text-xs font-medium text-[var(--color-ink)]">
          {row.plan_id?.name || 'Default Plan'}
        </span>
      ),
    },
    {
      header: 'Estimated Value',
      key: 'value',
      render: (row) => {
        const total = (row.lines || []).reduce(
          (acc, l) => acc + (l.quantity || 1) * (l.unit_price || 0),
          0
        );
        return (
          <span className="font-semibold text-xs">
            <MoneyText amount={total} />
          </span>
        );
      },
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="accentSubtle"
            onClick={(e) => handleInstantiateSubscription(row, e)}
            icon={Play}
          >
            Create Subscription
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTemplate(row);
              setIsDrawerOpen(true);
            }}
            icon={Edit2}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-[var(--color-ink)]">
            Quotation Templates
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Standard sales packages with predefined pricing schedules and product lines.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingTemplate(null);
            setIsDrawerOpen(true);
          }}
          icon={Plus}
        >
          New Template
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={templates}
        loading={loading}
        onRowClick={(row) => {
          setEditingTemplate(row);
          setIsDrawerOpen(true);
        }}
        emptyTitle="No quotation templates"
        emptyDescription="Create reusable bundle presets to accelerate enterprise contract sales."
      />

      <TemplateBuilderDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveTemplate}
        initialData={editingTemplate}
      />
    </div>
  );
}

