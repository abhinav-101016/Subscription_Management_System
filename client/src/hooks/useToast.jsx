import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast = { id, title, message, type };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = {
    info: (message, title) => addToast({ type: 'info', message, title }),
    success: (message, title) => addToast({ type: 'success', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((item) => {
          const icons = {
            success: <CheckCircle2 className="w-4 h-4 text-[#15805D] shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />,
            info: <Info className="w-4 h-4 text-[#2563EB] shrink-0" />,
          };

          const borders = {
            success: 'border-[#15805D]/30 bg-white dark:bg-[#171716]',
            warning: 'border-[#B45309]/30 bg-white dark:bg-[#171716]',
            error: 'border-[#B91C1C]/30 bg-white dark:bg-[#171716]',
            info: 'border-[var(--color-border)] bg-white dark:bg-[#171716]',
          };

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg text-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${borders[item.type]}`}
            >
              {icons[item.type]}
              <div className="flex-1 min-w-0">
                {item.title && (
                  <p className="font-medium text-[var(--color-ink)] leading-snug">{item.title}</p>
                )}
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-0.5">{item.message}</p>
              </div>
              <button
                onClick={() => removeToast(item.id)}
                className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] p-0.5 rounded transition-colors"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

