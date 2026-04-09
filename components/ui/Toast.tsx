// components/ui/Toast.tsx
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastType } from '@/lib/context/ToastContext';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-900/70',
    border: 'border-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-800 dark:text-emerald-300',
    iconColor: 'text-emerald-500',
    progress: 'bg-emerald-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-900/70',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-800 dark:text-red-300',
    iconColor: 'text-red-500',
    progress: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-900/70',
    border: 'border-amber-200 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-300',
    iconColor: 'text-amber-500',
    progress: 'bg-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-900/70',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-800 dark:text-blue-300',
    iconColor: 'text-blue-500',
    progress: 'bg-blue-500',
  },
};

export default function Toast({ id, message, type, onClose }: ToastProps) {
  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg shadow-black/10 ${config.bg} ${config.border} animate-in slide-in-from-right-4 duration-300`}
      style={{ minWidth: '320px', maxWidth: '420px' }}
    >
      <Icon size={20} className={`${config.iconColor} shrink-0 mt-0.5`} />
      <p className={`flex-1 text-sm font-medium ${config.text}`}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className={`shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${config.text}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}
