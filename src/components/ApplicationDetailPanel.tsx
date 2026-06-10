import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Pencil, Clock, MapPin, DollarSign, Calendar, FileText } from 'lucide-react';
import type { JobApplication, ApplicationStatus, InterviewDate } from '../types';
import { statusConfig } from './StatusBadge';
import ActivityTimeline from './ActivityTimeline';

const ALL_STATUSES: ApplicationStatus[] = ['Applied', 'Interview', 'Technical Test', 'Offer', 'Rejected'];

function uid() {
  return (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

interface ApplicationDetailPanelProps {
  application: JobApplication;
  onClose: () => void;
  onStatusChange: (updatedApp: JobApplication, prevStatus: ApplicationStatus) => Promise<void>;
  onUpdateDates: (updatedApp: JobApplication) => Promise<void>;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

export default function ApplicationDetailPanel({
  application,
  onClose,
  onStatusChange,
  onUpdateDates,
  onEdit,
  onDelete,
}: ApplicationDetailPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [currentApp, setCurrentApp] = useState(application);
  const [savingStatus, setSavingStatus] = useState<ApplicationStatus | null>(null);
  const [addingDate, setAddingDate] = useState(false);
  const [newDate, setNewDate] = useState<{ label: string; date: string }>({ label: 'Interview', date: '' });
  const [savingDate, setSavingDate] = useState(false);
  const [deletingDateId, setDeletingDateId] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (newStatus === currentApp.status || savingStatus !== null) return;
    setSavingStatus(newStatus);
    const prevStatus = currentApp.status;
    const updated = { ...currentApp, status: newStatus };
    setCurrentApp(updated);
    await onStatusChange(updated, prevStatus);
    setSavingStatus(null);
  };

  const handleAddDate = async () => {
    if (!newDate.date || !newDate.label.trim()) return;
    setSavingDate(true);
    const newEntry: InterviewDate = { id: uid(), date: newDate.date, label: newDate.label.trim() };
    const updated = { ...currentApp, interviewDates: [...currentApp.interviewDates, newEntry] };
    setCurrentApp(updated);
    await onUpdateDates(updated);
    setNewDate({ label: 'Interview', date: '' });
    setAddingDate(false);
    setSavingDate(false);
  };

  const handleDeleteDate = async (dateId: string) => {
    setDeletingDateId(dateId);
    const updated = { ...currentApp, interviewDates: currentApp.interviewDates.filter((d) => d.id !== dateId) };
    setCurrentApp(updated);
    await onUpdateDates(updated);
    setDeletingDateId(null);
  };

  const statusBtnCls = (s: ApplicationStatus) => {
    const cfg = statusConfig[s];
    if (currentApp.status === s) return `${cfg.classes} shadow-sm scale-105`;
    return 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50';
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel — slides in from right */}
      <div
        className={`relative ml-auto w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out ${mounted ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-slate-900 leading-tight">{currentApp.role}</p>
            <p className="text-sm text-slate-500 font-medium mt-0.5">{currentApp.company}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(currentApp)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Full edit"
              title="Edit all fields"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Status section */}
          <div className="px-6 py-5 border-b border-slate-50">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Status</p>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={savingStatus !== null}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${statusBtnCls(s)}`}
                >
                  {savingStatus === s && (
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  )}
                  {currentApp.status === s && savingStatus !== s && <Check className="w-3 h-3" />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Dates section */}
          <div className="px-6 py-5 border-b border-slate-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Interview Dates</p>
              {!addingDate && (
                <button
                  onClick={() => setAddingDate(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Date
                </button>
              )}
            </div>

            <div className="space-y-2">
              {currentApp.interviewDates
                .slice()
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((d) => (
                <div key={d.id} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5 group/date">
                  <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{d.label}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(d.date)}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteDate(d.id)}
                    disabled={deletingDateId === d.id}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/date:opacity-100 flex-shrink-0"
                    aria-label="Remove date"
                  >
                    {deletingDateId === d.id
                      ? <span className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 className="w-3 h-3" />
                    }
                  </button>
                </div>
              ))}

              {currentApp.interviewDates.length === 0 && !addingDate && (
                <p className="text-xs text-slate-400 italic">No interview dates scheduled yet.</p>
              )}

              {/* Inline add form */}
              {addingDate && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                  <input
                    type="text"
                    value={newDate.label}
                    onChange={(e) => setNewDate((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Label (e.g. Phone Screen, Final Round)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="datetime-local"
                    value={newDate.date}
                    onChange={(e) => setNewDate((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleAddDate}
                      disabled={savingDate || !newDate.date || !newDate.label.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {savingDate
                        ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                        : <Check className="w-3 h-3" />
                      }
                      Save Date
                    </button>
                    <button
                      onClick={() => { setAddingDate(false); setNewDate({ label: 'Interview', date: '' }); }}
                      className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details section */}
          <div className="px-6 py-5 border-b border-slate-50">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Details</p>
            <div className="space-y-2.5">
              {(currentApp.location || currentApp.workType) && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{[currentApp.workType, currentApp.location].filter(Boolean).join(' · ')}</span>
                </div>
              )}
              {(currentApp.salaryMin || currentApp.salaryMax) && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>
                    {currentApp.salaryMin && currentApp.salaryMax
                      ? `${currentApp.salaryMin} – ${currentApp.salaryMax}`
                      : currentApp.salaryMin || currentApp.salaryMax}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>Applied {formatDate(currentApp.dateApplied)}</span>
              </div>
              {currentApp.notes && (
                <div className="flex items-start gap-2.5 text-sm text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed whitespace-pre-wrap">{currentApp.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Activity</p>
            <ActivityTimeline applicationId={currentApp.id} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => onEdit(currentApp)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit All Fields
          </button>
          <button
            onClick={() => { onClose(); onDelete(currentApp.id); }}
            className="px-4 py-2.5 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
