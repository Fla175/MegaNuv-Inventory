// components/ui/ConfirmDialog.tsx
import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      iconColor: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      border: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isLoading && onCancel()}
      />
      
      {/* Dialog */}
      <div className={`relative w-full max-w-md rounded-[2rem] border-2 ${style.border} ${style.bg} shadow-2xl shadow-black/20 overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className="p-8">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-2xl ${style.iconBg} flex items-center justify-center`}>
              <AlertTriangle size={24} className={style.iconColor} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-blue-950 dark:text-white uppercase italic tracking-tight mb-2">
                {title}
              </h3>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {message}
              </p>
            </div>
            <button 
              onClick={() => !isLoading && onCancel()}
              disabled={isLoading}
              className="shrink-0 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex border-t border-zinc-200 dark:border-white/10">
          <button
            onClick={() => !isLoading && onCancel()}
            disabled={isLoading}
            className="flex-1 py-5 text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            {cancelLabel}
          </button>
          <div className="w-px bg-zinc-200 dark:bg-white/10" />
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-5 text-sm font-black uppercase tracking-widest ${style.button} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processando...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}