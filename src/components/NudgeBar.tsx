import React, { useMemo, useState } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';
import type { JobApplication, Nudge } from '../types';

interface NudgeBarProps {
  applications: JobApplication[];
  onOpenApp: (app: JobApplication) => void;
}

function computeNudges(applications: JobApplication[]): Nudge[] {
  const nudges: Nudge[] = [];
  const now = new Date();

  for (const app of applications) {
    if (app.status === 'Rejected' || app.status === 'Offer') continue;

    if (app.status === 'Applied') {
      const appliedDate = new Date(app.dateApplied);
      if (isNaN(appliedDate.getTime())) continue;
      const days = Math.floor((now.getTime() - appliedDate.getTime()) / 86400000);
      if (days >= 7) {
        nudges.push({
          applicationId: app.id,
          type: 'follow_up',
          message: `Applied ${days} days ago — consider following up`,
          daysStale: days,
          application: app,
        });
      }
    }

    if (app.status === 'Interview' || app.status === 'Technical Test') {
      const pastInterviews = app.interviewDates
        .filter((d) => d.date && new Date(d.date) < now)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (pastInterviews.length > 0) {
        const latest = new Date(pastInterviews[0].date);
        const days = Math.floor((now.getTime() - latest.getTime()) / 86400000);
        if (days >= 3) {
          nudges.push({
            applicationId: app.id,
            type: 'check_in',
            message: `Interview was ${days} days ago — have you heard back?`,
            daysStale: days,
            application: app,
          });
        }
      } else {
        const appliedDate = new Date(app.dateApplied);
        if (!isNaN(appliedDate.getTime())) {
          const days = Math.floor((now.getTime() - appliedDate.getTime()) / 86400000);
          if (days >= 7) {
            nudges.push({
              applicationId: app.id,
              type: 'check_in',
              message: `No interview scheduled in ${days} days`,
              daysStale: days,
              application: app,
            });
          }
        }
      }
    }
  }

  return nudges.sort((a, b) => b.daysStale - a.daysStale);
}

export default function NudgeBar({ applications, onOpenApp }: NudgeBarProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const nudges = useMemo(() => computeNudges(applications), [applications]);
  const visible = nudges.filter((n) => !dismissed.has(n.applicationId));

  if (visible.length === 0) return null;

  const dismiss = (id: string) => setDismissed((prev) => new Set([...prev, id]));
  const dismissAll = () => setDismissed(new Set(nudges.map((n) => n.applicationId)));

  return (
    <div className="bg-white border border-amber-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            {visible.length} application{visible.length !== 1 ? 's' : ''} need{visible.length === 1 ? 's' : ''} attention
          </span>
        </div>
        <button
          onClick={dismissAll}
          className="text-xs text-amber-600 hover:text-amber-800 font-medium"
        >
          Dismiss all
        </button>
      </div>

      {/* Nudge list */}
      <div className="divide-y divide-slate-50">
        {visible.slice(0, 5).map((nudge) => (
          <div key={nudge.applicationId} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
            {/* Staleness indicator */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
              nudge.daysStale >= 14 ? 'bg-red-100 text-red-600' :
              nudge.daysStale >= 7  ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-600'
            }`}>
              {nudge.daysStale}d
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {nudge.application.role} <span className="font-normal text-slate-500">at {nudge.application.company}</span>
              </p>
              <p className="text-xs text-slate-500 truncate">{nudge.message}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onOpenApp(nudge.application)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                title="Open application"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => dismiss(nudge.applicationId)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {visible.length > 5 && (
        <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
          +{visible.length - 5} more nudges
        </div>
      )}
    </div>
  );
}
