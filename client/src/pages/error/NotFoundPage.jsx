import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import { getDefaultPathForRole } from '../../routes/routeConfig';

export default function NotFoundPage() {
  const { role, isAuthenticated } = useAuth();
  const homePath = isAuthenticated ? getDefaultPathForRole(role) : '/';

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] paper-texture flex items-center justify-center p-6 text-[var(--color-ink)]">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 text-center space-y-6 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[var(--color-canvas-subtle)] text-[var(--color-ink-muted)] flex items-center justify-center mx-auto border border-[var(--color-border)]">
          <FileQuestion className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-mono text-[var(--color-ink-muted)]">HTTP 404</p>
          <h1 className="font-serif-display text-2xl">Page Not Found</h1>
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
            The requested contract, document, or route could not be resolved on the financial ledger.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Link to={homePath}>
            <Button variant="primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Overview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

