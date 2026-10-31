import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-[var(--color-danger)] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg text-[var(--color-ink)]">Something went wrong</h3>
              <p className="text-sm text-[var(--color-muted)]">
                An unexpected interface error occurred. Your financial records and changes remain secure.
              </p>
            </div>
            {this.state.error?.message && (
              <pre className="text-xs bg-[var(--color-canvas)] p-3 rounded border border-[var(--color-border)] text-left overflow-x-auto text-[var(--color-ink)] font-mono">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2 flex justify-center">
              <Button variant="secondary" onClick={this.handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
