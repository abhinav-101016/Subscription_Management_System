import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { getDefaultPathForRole } from '../../routes/routeConfig';

export function Topbar({ onOpenCommandPalette }) {
  const location = useLocation();
  const { user, role, logout } = useAuth();
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Build clean breadcrumbs from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = pathSegments
    .filter((seg) => seg !== 'app')
    .map((segment, index, arr) => {
      const formatted = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { name: formatted, isLast: index === arr.length - 1 };
    });

  const homePath = getDefaultPathForRole(role);

  return (
    <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 flex items-center justify-between gap-4 z-20 shrink-0">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
        <Link
          to={homePath}
          className="hover:text-[var(--color-ink)] transition-colors font-medium font-serif-display text-sm text-[var(--color-ink)]"
        >
          Cadence
        </Link>
        {breadcrumbItems.map((item, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-[var(--color-ink-faint)]" />
            {item.isLast ? (
              <span className="font-semibold text-[var(--color-ink)]">{item.name}</span>
            ) : (
              <span className="text-[var(--color-ink-muted)]">{item.name}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right Controls: Command Palette Search Pill & Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Quick Search ⌘K Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs text-[var(--color-ink-muted)] hover:border-[var(--color-border-subtle)] hover:text-[var(--color-ink)] transition-all shadow-2xs"
        >
          <Search className="w-3.5 h-3.5 text-[var(--color-ink-faint)]" />
          <span className="hidden sm:inline">Search ledger & commands...</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink-muted)]">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Night Ledger (dark)' : 'Warm Paper (light)'} mode`}
          className="p-2 rounded-md border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors shadow-2xs"
        >
          {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
}
