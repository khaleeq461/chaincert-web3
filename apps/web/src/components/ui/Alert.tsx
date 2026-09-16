import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, children, onClose, className = '' }: AlertProps) {
  const styles = {
    info: {
      container: 'bg-brand-500/10 border-brand-500/25 text-brand-200',
      icon: Info,
      iconColor: 'text-brand-400',
    },
    success: {
      container: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    warning: {
      container: 'bg-amber-500/10 border-amber-500/25 text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    error: {
      container: 'bg-rose-500/10 border-rose-500/25 text-rose-200',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
    },
  };

  const current = styles[variant];
  const Icon = current.icon;

  return (
    <div className={`rounded-xl border p-4 flex gap-3 text-sm leading-relaxed ${current.container} ${className}`}>
      <Icon className={`w-5 h-5 shrink-0 ${current.iconColor} mt-0.5`} />
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1 text-white">{title}</h5>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition p-0.5 shrink-0 self-start"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
