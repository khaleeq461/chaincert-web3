import React from 'react';
import { ShieldCheck, AlertOctagon, Clock, HelpCircle, Loader2 } from 'lucide-react';

export type StatusType = 'VERIFIED' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND' | 'PENDING';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = 'md', showIcon = true, className = '' }: StatusBadgeProps) {
  const configs = {
    VERIFIED: {
      label: 'Verified & Authentic',
      shortLabel: 'Verified',
      icon: ShieldCheck,
      classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-emerald-500/10',
      dotClass: 'bg-emerald-400',
    },
    REVOKED: {
      label: 'Revoked by Issuer',
      shortLabel: 'Revoked',
      icon: AlertOctagon,
      classes: 'bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-rose-500/10',
      dotClass: 'bg-rose-400',
    },
    EXPIRED: {
      label: 'Expired Credential',
      shortLabel: 'Expired',
      icon: Clock,
      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/25 shadow-amber-500/10',
      dotClass: 'bg-amber-400',
    },
    PENDING: {
      label: 'Awaiting Confirmation',
      shortLabel: 'Pending',
      icon: Loader2,
      classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25 shadow-indigo-500/10 animate-pulse',
      dotClass: 'bg-indigo-400',
    },
    NOT_FOUND: {
      label: 'Not Found on Blockchain',
      shortLabel: 'Not Found',
      icon: HelpCircle,
      classes: 'bg-gray-500/10 text-gray-400 border-gray-500/25',
      dotClass: 'bg-gray-400',
    },
  };

  const current = configs[status] || configs.NOT_FOUND;
  const Icon = current.icon;

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-4 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm select-none ${sizeStyles[size]} ${current.classes} ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span>{size === 'sm' ? current.shortLabel : current.label}</span>
    </span>
  );
}
