import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight, FilePen, PlusCircle } from 'lucide-react';
import type { ActivityLog, ApplicationStatus } from '../types';
import { fetchActivityLogs } from '../hooks/useApplications';
import StatusBadge from './StatusBadge';

interface ActivityTimelineProps {
  applicationId: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function LogEntry({ log }: { log: ActivityLog }) {
  if (log.type === 'created') {
    return (
      <div className="flex gap-3 items-start">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <PlusCircle className="w-3 h-3 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-700 font-medium">Application created</p>
          {log.toStatus && (
            <div className="mt-1">
              <StatusBadge status={log.toStatus as ApplicationStatus} size="sm" />
            </div>
          )}
          <p className="text-xs text-slate-400 mt-1">{timeAgo(log.createdAt)}</p>
        </div>
      </div>
    );
  }

  if (log.type === 'status_changed' && log.fromStatus && log.toStatus) {
    return (
      <div className="flex gap-3 items-start">
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <ArrowRight className="w-3 h-3 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-700 font-medium">Status changed</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <StatusBadge status={log.fromStatus as ApplicationStatus} size="sm" />
            <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <StatusBadge status={log.toStatus as ApplicationStatus} size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">{timeAgo(log.createdAt)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <FilePen className="w-3 h-3 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700 font-medium">Application updated</p>
        <p className="text-xs text-slate-400 mt-1">{timeAgo(log.createdAt)}</p>
      </div>
    </div>
  );
}

export default function ActivityTimeline({ applicationId }: ActivityTimelineProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchActivityLogs(applicationId).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        Loading history...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic py-2">No activity recorded yet.</p>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      {logs.map((log, i) => (
        <div key={log.id} className="relative">
          {i < logs.length - 1 && (
            <div className="absolute left-3 top-7 w-px h-full bg-slate-100" />
          )}
          <LogEntry log={log} />
        </div>
      ))}
    </div>
  );
}
