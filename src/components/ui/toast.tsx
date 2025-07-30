'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-yellow-600 text-white',
  info: 'bg-blue-600 text-white',
};

export function ToastComponent({ 
  id, 
  type, 
  title, 
  description, 
  action,
  onClose 
}: ToastProps) {
  const Icon = toastIcons[type];

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`${toastStyles[type]} rounded-lg shadow-lg p-4 max-w-md w-full flex items-start gap-3 animate-slide-in-from-right`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {description && (
          <p className="text-xs mt-1 opacity-90">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs mt-2 underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 rounded-md p-1 hover:bg-white/20 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { 
  toasts: Toast[]; 
  onClose: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}