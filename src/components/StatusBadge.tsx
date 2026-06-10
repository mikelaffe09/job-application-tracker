import React from 'react';
import type { ApplicationStatus } from '../types';

const config: Record<ApplicationStatus, { label: string; classes: string }> = {
  Applied: {
    label: 'Applied',
    classes: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  Interview: {
    label: 'Interview',
    classes: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  'Technical Test': {
    label: 'Technical Test',
    classes: 'bg-violet-100 text-violet-700 border border-violet-200',
  },
  Offer: {
    label: 'Offer',
    classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  Rejected: {
    label: 'Rejected',
    classes: 'bg-red-100 text-red-700 border border-red-200',
  },
};

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { label, classes } = config[status];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${classes} ${sizeClasses}`}>
      {label}
    </span>
  );
}

export { config as statusConfig };
