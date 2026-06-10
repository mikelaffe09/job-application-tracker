import React from 'react';
import { MapPin, DollarSign, Calendar, Pencil, Trash2, Clock } from 'lucide-react';
import type { JobApplication } from '../types';
import StatusBadge from './StatusBadge';

interface ApplicationCardProps {
  application: JobApplication;
  onOpen: (app: JobApplication) => void;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ApplicationCard({ application, onOpen, onEdit, onDelete }: ApplicationCardProps) {
  const { company, role, location, workType, salaryMin, salaryMax, status, dateApplied, interviewDates } = application;

  const nextInterview = interviewDates
    .filter((d) => d.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .find((d) => new Date(d.date) >= new Date());

  const hasSalary = salaryMin || salaryMax;
  const hasLocation = location || workType;

  return (
    <div
      onClick={() => onOpen(application)}
      className="group bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-100 transition-all duration-200 cursor-pointer flex flex-col"
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900 truncate">{role}</p>
            <p className="text-sm text-slate-500 font-medium truncate mt-0.5">{company}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(application); }}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Edit application"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(application.id); }}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Delete application"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
          {hasLocation && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {[workType, location].filter(Boolean).join(' · ')}
            </span>
          )}
          {hasSalary && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {salaryMin && salaryMax ? `${salaryMin} – ${salaryMax}` : salaryMin || salaryMax}
            </span>
          )}
          {dateApplied && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(dateApplied)}
            </span>
          )}
        </div>

        {/* Next interview */}
        {nextInterview && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {nextInterview.label}: {formatDateTime(nextInterview.date)}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-50">
          <StatusBadge status={status} />
          <span className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">View details →</span>
        </div>
      </div>
    </div>
  );
}
