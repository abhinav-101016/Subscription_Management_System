import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

export function Topbar({ onOpenCommandPalette }) {
  const location = useLocation();
  const { user, logout } = useAuth();
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
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const formatted = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { name: formatted, url, isLast: index === pathSegments.length - 1 };
  });

  return (
    <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md px-6 flex items-center justify-between gap-4 z-20 shrink-0">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
        <Link
          to="/dashboard"
          className="hover:text-[var(--color-ink)] transition-colors font-medium"
        >
          Cadence
        </Link>
        {breadcrumbItems.map((item) => (
          <React.Fragment key={item.url}>
            <ChevronRight className="w-3 h-3 text-[var(--color-ink-faint)]" />
            {item.isLast ? (
              <span className="font-semibold text-[var(--color-ink)]">{item.name}</span>
            ) : (
              <Link to={item.url} className="hover:text-[var(--color-ink)] transition-colors">
                {item.name}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-faint)] transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick search...</span>
          <kbd className="font-num text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink-faint)]">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[var(--color-border)]">
          <div className="w-7 h-7 rounded-full bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] flex items-center justify-center text-xs font-semibold text-[var(--color-ink)]">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-medium text-[var(--color-ink)] leading-none">
              {user?.name}
            </span>
            <span className="text-[10px] text-[var(--color-ink-faint)] capitalize mt-0.5">
              {user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-md text-[var(--color-ink-faint)] hover:text-[#B91C1C] hover:bg-rose-500/10 transition-colors ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

