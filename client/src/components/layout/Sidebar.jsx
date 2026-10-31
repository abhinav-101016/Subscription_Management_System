import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  Sliders,
  Users,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { cn } from '../../lib/utils';

export function Sidebar({ collapsed, onToggle }) {
  const { user, isAdmin, isStaff, isCustomer, switchRole } = useAuth();

  // Navigation items structured by category and role
  const navItems = [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
        { name: 'Customer Portal', path: '/portal', icon: ShieldCheck, roles: ['customer'] },
      ],
    },
    {
      label: 'Lifecycle & Contracts',
      items: [
        { name: 'Subscriptions', path: '/subscriptions', icon: Repeat, roles: ['admin', 'staff'] },
        { name: 'Invoices', path: '/invoices', icon: Receipt, roles: ['admin', 'staff', 'customer'] },
        { name: 'Payments', path: '/payments', icon: CreditCard, roles: ['admin', 'staff', 'customer'] },
      ],
    },
    {
      label: 'Billing & Configuration',
      items: [
        { name: 'Billing Console', path: '/billing-console', icon: Sliders, roles: ['admin', 'staff'] },
        { name: 'Plans', path: '/plans', icon: CalendarDays, roles: ['admin', 'staff'] },
        { name: 'Templates', path: '/templates', icon: FileSpreadsheet, roles: ['admin', 'staff'] },
        { name: 'Discount Rules', path: '/discounts', icon: Percent, roles: ['admin'] },
        { name: 'Tax Rules', path: '/taxes', icon: ShieldCheck, roles: ['admin'] },
      ],
    },
    {
      label: 'Governance',
      items: [
        { name: 'Staff Management', path: '/staff', icon: Users, roles: ['admin'] },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen border-r border-[var(--color-border)] bg-[var(--color-surface)] select-none transition-all duration-200 z-30 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--color-border)]">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-[#0D4A38] dark:bg-[#15805D] text-white flex items-center justify-center font-serif-display text-base font-bold tracking-tighter shrink-0">
            C
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-[var(--color-ink)] leading-none">
                Cadence
              </span>
              <span className="text-[10px] text-[var(--color-ink-faint)] tracking-wider uppercase mt-0.5">
                Financial Ops
              </span>
            </div>
          )}
        </NavLink>

        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
          className="p-1 rounded-md text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas-subtle)] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navItems.map((group) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(user?.role || 'admin')
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                  {group.label}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors group relative',
                        isActive
                          ? 'bg-[#0D4A38]/10 text-[#0D4A38] dark:bg-[#15805D]/15 dark:text-[#1BA376] font-semibold'
                          : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive
                              ? 'text-[#0D4A38] dark:text-[#15805D]'
                              : 'text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]'
                          )}
                        />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                        {collapsed && isActive && (
                          <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-[#0D4A38] dark:bg-[#15805D]" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Role Switcher & Persona Card (Live Testing Aid) */}
      <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-canvas)]/30">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-[var(--color-ink-faint)]">
                Active Persona
              </span>
              <span className="text-[10px] font-num px-1.5 py-0.5 rounded bg-[var(--color-canvas-subtle)] text-[var(--color-ink-muted)] border border-[var(--color-border-subtle)] capitalize">
                {user?.role || 'Guest'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {['admin', 'staff', 'customer'].map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={cn(
                    'py-1 text-[11px] font-medium rounded border transition-colors capitalize text-center',
                    user?.role === r
                      ? 'border-[#0D4A38] dark:border-[#15805D] bg-[#0D4A38]/10 dark:bg-[#15805D]/20 text-[#0D4A38] dark:text-[#1BA376]'
                      : 'border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => switchRole(user?.role === 'admin' ? 'staff' : user?.role === 'staff' ? 'customer' : 'admin')}
              title={`Role: ${user?.role}. Click to cycle.`}
              className="w-8 h-8 rounded-full border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] text-[var(--color-ink)] text-xs font-semibold uppercase flex items-center justify-center hover:border-[#0D4A38]"
            >
              {user?.role?.[0] || 'A'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

