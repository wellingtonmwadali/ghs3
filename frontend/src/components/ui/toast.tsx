'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: { duration?: number; action?: Toast['action'] }) => void;
  success: (message: string, options?: { duration?: number; action?: Toast['action'] }) => void;
  error: (message: string, options?: { duration?: number; action?: Toast['action'] }) => void;
  info: (message: string, options?: { duration?: number; action?: Toast['action'] }) => void;
  warning: (message: string, options?: { duration?: number; action?: Toast['action'] }) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// Maximum number of toasts displayed at once
const MAX_TOASTS = 5;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timeoutRefs = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showToast = React.useCallback(
    (
      message: string,
      type: ToastType = 'info',
      options?: { duration?: number; action?: Toast['action'] }
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const duration = options?.duration ?? 5000;

      setToasts((prev) => {
        // Limit to MAX_TOASTS, remove oldest if exceeded
        const updated = [...prev, { id, message, type, duration, action: options?.action }];
        if (updated.length > MAX_TOASTS) {
          const removed = updated.shift();
          if (removed) {
            const timeout = timeoutRefs.current.get(removed.id);
            if (timeout) clearTimeout(timeout);
            timeoutRefs.current.delete(removed.id);
          }
        }
        return updated;
      });

      // Auto remove after duration
      if (duration > 0) {
        const timeout = setTimeout(() => {
          removeToast(id);
        }, duration);
        timeoutRefs.current.set(id, timeout);
      }
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts([]);
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    success: (message: string, options?) => showToast(message, 'success', options),
    error: (message: string, options?) => showToast(message, 'error', options),
    info: (message: string, options?) => showToast(message, 'info', options),
    warning: (message: string, options?) => showToast(message, 'warning', options),
    dismiss: removeToast,
    dismissAll,
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div 
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right pointer-events-auto ${getStyles(
              toast.type
            )}`}
          >
            {getIcon(toast.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium break-words">{toast.message}</p>
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                  className="mt-2 text-xs font-semibold underline hover:no-underline transition-all"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
