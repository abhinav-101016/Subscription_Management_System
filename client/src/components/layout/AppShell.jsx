import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { initSmoothScroll } from '../../lib/lenis';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis smooth scroll on the scrollable container
    const cleanupLenis = initSmoothScroll(mainRef.current);

    // Global keyboard shortcuts (⌘K for command palette, ⌘B for sidebar toggle)
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (typeof cleanupLenis === 'function') {
        try {
          cleanupLenis();
        } catch (_) {}
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-canvas)] text-[var(--color-ink)]">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Body */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <Topbar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

        {/* Scrollable Content Container */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
