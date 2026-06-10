import React from 'react';
import { Briefcase, CalendarClock, Trophy, TrendingDown } from 'lucide-react';
import type { JobApplication } from '../types';

interface AnalyticsBarProps {
  applications: JobApplication[];
}

export default function AnalyticsBar({ applications }: AnalyticsBarProps) {
  const total = applications.length;
  const pending = applications.filter(
    (a) => a.status === 'Interview' || a.status === 'Technical Test'
  ).length;
  const offers = applications.filter((a) => a.status === 'Offer').length;
  const rejected = applications.filter((a) => a.status === 'Rejected').length;
  const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

  const stats = [
    {
      label: 'Total Applications',
      value: total,
      icon: Briefcase,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      valueColor: 'text-slate-900',
    },
    {
      label: 'Pending Interviews',
      value: pending,
      icon: CalendarClock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueColor: 'text-slate-900',
    },
    {
      label: 'Offers Received',
      value: offers,
      icon: Trophy,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-700',
    },
    {
      label: 'Rejection Rate',
      value: `${rejectionRate}%`,
      icon: TrendingDown,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      valueColor: rejected > 0 ? 'text-red-600' : 'text-slate-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium leading-none mb-1">{label}</p>
            <p className={`text-2xl font-bold ${valueColor} leading-none`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
