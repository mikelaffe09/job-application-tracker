import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { JobApplication, ApplicationStatus, WorkType, InterviewDate } from '../types';

const STATUSES: ApplicationStatus[] = ['Applied', 'Interview', 'Technical Test', 'Offer', 'Rejected'];
const WORK_TYPES: WorkType[] = ['Remote', 'Hybrid', 'On-site'];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface ApplicationModalProps {
  application: JobApplication | null;
  onSave: (app: JobApplication) => void;
  onClose: () => void;
}

const emptyForm = (): Omit<JobApplication, 'id' | 'createdAt'> => ({
  company: '',
  role: '',
  location: '',
  workType: 'Remote',
  salaryMin: '',
  salaryMax: '',
  status: 'Applied',
  notes: '',
  interviewDates: [],
  dateApplied: new Date().toISOString().slice(0, 10),
});

export default function ApplicationModal({ application, onSave, onClose }: ApplicationModalProps) {
  const [form, setForm] = useState<Omit<JobApplication, 'id' | 'createdAt'>>(
    application ? { ...application } : emptyForm()
  );

  useEffect(() => {
    setForm(application ? { ...application } : emptyForm());
  }, [application]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addInterviewDate = () => {
    setForm((prev) => ({
      ...prev,
      interviewDates: [
        ...prev.interviewDates,
        { id: uid(), date: '', label: 'Interview' },
      ],
    }));
  };

  const updateInterviewDate = (id: string, field: keyof InterviewDate, value: string) => {
    setForm((prev) => ({
      ...prev,
      interviewDates: prev.interviewDates.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  };

  const removeInterviewDate = (id: string) => {
    setForm((prev) => ({
      ...prev,
      interviewDates: prev.interviewDates.filter((d) => d.id !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    onSave({
      ...form,
      id: application?.id ?? uid(),
      createdAt: application?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {application ? 'Edit Application' : 'New Application'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Company + Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company *">
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
                placeholder="Acme Corp"
                className={inputCls}
              />
            </Field>
            <Field label="Role / Job Title *">
              <input
                type="text"
                required
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                placeholder="Senior Engineer"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Location">
              <input
                type="text"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="San Francisco, CA"
                className={inputCls}
              />
            </Field>
            <Field label="Work Type">
              <select
                value={form.workType}
                onChange={(e) => set('workType', e.target.value)}
                className={inputCls}
              >
                {WORK_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Salary Min">
              <input
                type="text"
                value={form.salaryMin}
                onChange={(e) => set('salaryMin', e.target.value)}
                placeholder="$80,000"
                className={inputCls}
              />
            </Field>
            <Field label="Salary Max">
              <input
                type="text"
                value={form.salaryMax}
                onChange={(e) => set('salaryMax', e.target.value)}
                placeholder="$120,000"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Status + Date Applied */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputCls}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Date Applied">
              <input
                type="date"
                value={form.dateApplied}
                onChange={(e) => set('dateApplied', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Interview Dates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>Interview Dates</label>
              <button
                type="button"
                onClick={addInterviewDate}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Date
              </button>
            </div>
            <div className="space-y-2">
              {form.interviewDates.map((d) => (
                <div key={d.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={d.label}
                    onChange={(e) => updateInterviewDate(d.id, 'label', e.target.value)}
                    placeholder="Label"
                    className={`${inputCls} w-32 flex-shrink-0`}
                  />
                  <input
                    type="datetime-local"
                    value={d.date}
                    onChange={(e) => updateInterviewDate(d.id, 'date', e.target.value)}
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeInterviewDate(d.id)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {form.interviewDates.length === 0 && (
                <p className="text-sm text-slate-400 italic">No interview dates added.</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Recruiter contact, key requirements, impressions..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="app-form"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
          >
            {application ? 'Save Changes' : 'Add Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}
