import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { getNavItemsForRole } from '../../routes/routeConfig';
import { cn } from '../../lib/utils';

export function Sidebar({ collapsed, onToggle }) {
  const { user, role, logout } = useAuth();
  const navItems = getNavItemsForRole(role);

  return (
    <aside
      className={cn(
        'h-screen flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] select-none transition-all duration-200 z-30 shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand & Workspace Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded bg-[var(--color-ink)] text-[var(--color-canvas)] flex items-center justify-center font-serif text-lg font-bold shrink-0">
            C
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-serif-display text-base font-semibold leading-tight text-[var(--color-ink)] truncate">
                Cadence
              </span>
              <span className="text-[10px] tracking-wider uppercase font-mono text-[var(--color-ink-muted)] truncate">
                Financial Ledger
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
          className="p-1 rounded text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links — Driven strictly by routeConfig & authenticated role */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group relative',
                  isActive
                    ? 'text-[var(--color-ink)] bg-[var(--color-canvas)] font-semibold shadow-2xs'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[var(--color-accent)]" />
                  )}
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]'
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Authenticated Identity & Logout (No persona switchers) */}
      <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-canvas-subtle)]/40">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-[var(--color-ink)] truncate">
                {user?.name || user?.email || 'Authenticated User'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-mono tracking-wider px-1 py-0.2 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink-muted)]">
                  {role}
                </span>
                <span className="text-[11px] text-[var(--color-ink-faint)] truncate max-w-[110px]">
                  {user?.email}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out of Cadence"
              className="p-1.5 rounded text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              title={`${user?.name || user?.email} (${role})`}
              className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] font-mono text-xs flex items-center justify-center font-bold uppercase"
            >
              {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
