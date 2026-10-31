import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import { getDefaultPathForRole } from '../../routes/routeConfig';

export default function ForbiddenPage() {
  const { role } = useAuth();
  const homePath = getDefaultPathForRole(role);

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] paper-texture flex items-center justify-center p-6 text-[var(--color-ink)]">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 text-center space-y-6 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[var(--color-accent-tint)] text-[var(--color-accent)] flex items-center justify-center mx-auto border border-[var(--color-accent-border)]">
          <ShieldAlert className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-mono text-[var(--color-ink-muted)]">HTTP 403 Forbidden</p>
          <h1 className="font-serif-display text-2xl">Access Restricted</h1>
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
            Your current account role (<span className="font-mono text-[var(--color-ink)] font-semibold">{role}</span>) does not carry administrative authorization for this section.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Link to={homePath}>
            <Button variant="primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Authorized Workspace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
