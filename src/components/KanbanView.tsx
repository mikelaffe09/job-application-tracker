import React, { useState, useRef } from 'react';
import { MapPin, DollarSign, Clock, Pencil, GripVertical } from 'lucide-react';
import type { JobApplication, ApplicationStatus } from '../types';
import StatusBadge, { statusConfig } from './StatusBadge';

const COLUMNS: ApplicationStatus[] = ['Applied', 'Interview', 'Technical Test', 'Offer', 'Rejected'];

const columnBg: Record<ApplicationStatus, string> = {
  Applied: 'bg-blue-50 border-blue-100',
  Interview: 'bg-amber-50 border-amber-100',
  'Technical Test': 'bg-violet-50 border-violet-100',
  Offer: 'bg-emerald-50 border-emerald-100',
  Rejected: 'bg-red-50 border-red-100',
};

const columnHighlight: Record<ApplicationStatus, string> = {
  Applied: 'bg-blue-100 border-blue-300',
  Interview: 'bg-amber-100 border-amber-300',
  'Technical Test': 'bg-violet-100 border-violet-300',
  Offer: 'bg-emerald-100 border-emerald-300',
  Rejected: 'bg-red-100 border-red-300',
};

const columnHeader: Record<ApplicationStatus, string> = {
  Applied: 'text-blue-700',
  Interview: 'text-amber-700',
  'Technical Test': 'text-violet-700',
  Offer: 'text-emerald-700',
  Rejected: 'text-red-700',
};

interface KanbanViewProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
}

function formatDateTime(iso: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

interface KanbanCardProps {
  app: JobApplication;
  onEdit: () => void;
  isDragging: boolean;
}

function KanbanCard({ app, onEdit, isDragging }: KanbanCardProps) {
  const nextInterview = app.interviewDates
    .filter((d) => d.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .find((d) => new Date(d.date) >= new Date());

  return (
    <div
      className={`bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{app.role}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{app.company}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-6 h-6 flex items-center justify-center rounded-full text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
        {app.location && (
          <span className="flex items-center gap-1 truncate max-w-full">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {[app.workType, app.location].filter(Boolean).join(' · ')}
          </span>
        )}
        {(app.salaryMin || app.salaryMax) && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {app.salaryMin && app.salaryMax
              ? `${app.salaryMin}–${app.salaryMax}`
              : app.salaryMin || app.salaryMax}
          </span>
        )}
      </div>

      {nextInterview && (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{formatDateTime(nextInterview.date)}</span>
        </div>
      )}

      <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {new Date(app.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <GripVertical className="w-3 h-3 text-slate-300" />
      </div>
    </div>
  );
}

export default function KanbanView({ applications, onEdit, onStatusChange }: KanbanViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ApplicationStatus | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const byStatus = (status: ApplicationStatus) =>
    applications.filter((a) => a.status === status);

  const handleDragStart = (id: string) => {
    setDraggingId(id);
    dragIdRef.current = id;
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStatus(null);
    dragIdRef.current = null;
  };

  const handleDrop = (status: ApplicationStatus) => {
    const id = dragIdRef.current;
    if (!id) return;
    const app = applications.find((a) => a.id === id);
    if (app && app.status !== status) {
      onStatusChange(id, status);
    }
    setDraggingId(null);
    setDragOverStatus(null);
    dragIdRef.current = null;
  };

  const totalApps = applications.length;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((status) => {
          const cards = byStatus(status);
          const isDragTarget = dragOverStatus === status;
          const bgCls = isDragTarget ? columnHighlight[status] : columnBg[status];

          return (
            <div
              key={status}
              className={`w-72 flex-shrink-0 border rounded-2xl transition-colors duration-150 ${bgCls}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverStatus(null);
                }
              }}
              onDrop={() => handleDrop(status)}
            >
              {/* Column header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${columnHeader[status]}`}>{status}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/70 ${columnHeader[status]}`}>
                    {cards.length}
                  </span>
                </div>
                {totalApps > 0 && (
                  <span className="text-xs text-slate-400">
                    {Math.round((cards.length / totalApps) * 100)}%
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="px-3 pb-3 space-y-2 min-h-[120px]">
                {cards.map((app) => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={() => handleDragStart(app.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <KanbanCard
                      app={app}
                      onEdit={() => onEdit(app)}
                      isDragging={draggingId === app.id}
                    />
                  </div>
                ))}
                {cards.length === 0 && (
                  <div className={`h-20 border-2 border-dashed rounded-xl flex items-center justify-center transition-colors ${
                    isDragTarget ? 'border-current opacity-50' : 'border-slate-200 opacity-40'
                  }`}>
                    <p className="text-xs text-slate-400">
                      {isDragTarget ? 'Drop here' : 'No applications'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {applications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-slate-500 text-sm">Add applications in the Dashboard view to see them here.</p>
        </div>
      )}
    </div>
  );
}
