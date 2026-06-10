import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Briefcase, CalendarDays, X, Kanban, LogOut, User } from 'lucide-react';
import type { JobApplication, ApplicationStatus, AppView } from './types';
import { useApplications } from './hooks/useApplications';
import { useNotifications } from './hooks/useNotifications';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import AnalyticsBar from './components/AnalyticsBar';
import ApplicationCard from './components/ApplicationCard';
import ApplicationModal from './components/ApplicationModal';
import ApplicationDetailPanel from './components/ApplicationDetailPanel';
import CalendarView from './components/CalendarView';
import KanbanView from './components/KanbanView';
import NudgeBar from './components/NudgeBar';

const ALL_STATUSES: ApplicationStatus[] = ['Applied', 'Interview', 'Technical Test', 'Offer', 'Rejected'];

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5">
        <Briefcase className="w-9 h-9 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">No applications yet</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6">
        Start tracking your job search by adding your first application.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
      >
        <Plus className="w-4 h-4" /> Add Application
      </button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading your applications...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <AuthPage />;

  return <AppInner key={user.id} onSignOut={signOut} userEmail={user.email ?? ''} />;
}

function AppInner({ onSignOut, userEmail }: { onSignOut: () => void; userEmail: string }) {
  const { applications, loading, addApplication, updateApplication, deleteApplication } = useApplications();
  const [view, setView] = useState<AppView>('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<JobApplication | null>(null);
  const [detailTarget, setDetailTarget] = useState<JobApplication | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');

  const { permission, enabled: notifEnabled, toggle: toggleNotif, scheduleNotification } = useNotifications();

  useEffect(() => {
    if (!notifEnabled) return;
    for (const app of applications) {
      for (const interview of app.interviewDates) {
        if (!interview.date) continue;
        const interviewTime = new Date(interview.date);
        if (isNaN(interviewTime.getTime())) continue;
        const reminderTime = new Date(interviewTime.getTime() - 60 * 60 * 1000);
        if (reminderTime > new Date()) {
          scheduleNotification(
            `Upcoming: ${interview.label}`,
            `${app.role} at ${app.company} — in 1 hour`,
            reminderTime
          );
        }
      }
    }
  }, [notifEnabled, applications, scheduleNotification]);

  const openAdd = useCallback(() => {
    setEditTarget(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((app: JobApplication) => {
    setDetailTarget(null);
    setEditTarget(app);
    setModalOpen(true);
  }, []);

  const openDetail = useCallback((app: JobApplication) => {
    setDetailTarget(app);
  }, []);

  const handleSave = useCallback(
    async (app: JobApplication) => {
      if (editTarget) {
        const prevStatus = editTarget.status !== app.status ? editTarget.status : undefined;
        await updateApplication(app, prevStatus);
      } else {
        const { id: _id, createdAt: _c, ...appData } = app;
        await addApplication(appData);
      }
      setModalOpen(false);
    },
    [editTarget, addApplication, updateApplication]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDetailTarget(null);
      await deleteApplication(id);
    },
    [deleteApplication]
  );

  const handleDetailStatusChange = useCallback(
    async (updatedApp: JobApplication, prevStatus: ApplicationStatus) => {
      await updateApplication(updatedApp, prevStatus);
    },
    [updateApplication]
  );

  const handleDetailUpdateDates = useCallback(
    async (updatedApp: JobApplication) => {
      await updateApplication(updatedApp);
    },
    [updateApplication]
  );

  const handleKanbanStatusChange = useCallback(
    async (id: string, newStatus: ApplicationStatus) => {
      const app = applications.find((a) => a.id === id);
      if (!app) return;
      await updateApplication({ ...app, status: newStatus }, app.status);
    },
    [applications, updateApplication]
  );

  const filtered = useMemo(
    () =>
      applications.filter((app) => {
        const matchesSearch =
          !search ||
          app.company.toLowerCase().includes(search.toLowerCase()) ||
          app.role.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [applications, search, statusFilter]
  );

  const navTabs = [
    { id: 'dashboard' as AppView, label: 'Dashboard', Icon: Briefcase },
    { id: 'kanban' as AppView, label: 'Kanban', Icon: Kanban },
    { id: 'calendar' as AppView, label: 'Calendar', Icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Tracker</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your job search in one place</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-600 font-medium truncate max-w-[140px]">{userEmail}</span>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Application</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* Nav tabs */}
        <nav className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-sm mb-8 w-fit">
          {navTabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>

        {/* Dashboard */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <AnalyticsBar applications={applications} />

            {applications.length > 0 && (
              <NudgeBar applications={applications} onOpenApp={openDetail} />
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search company or role..."
                  className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'All'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  All ({applications.length})
                </button>
                {ALL_STATUSES.map((s) => {
                  const count = applications.filter((a) => a.status === s).length;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        statusFilter === s
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {s} {count > 0 && `(${count})`}
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <EmptyState onAdd={openAdd} />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <p className="text-slate-500 text-sm">No applications match your filters.</p>
                <button
                  onClick={() => { setSearch(''); setStatusFilter('All'); }}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onOpen={openDetail}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Kanban */}
        {view === 'kanban' && (
          <KanbanView
            applications={applications}
            onEdit={openDetail}
            onStatusChange={handleKanbanStatusChange}
          />
        )}

        {/* Calendar */}
        {view === 'calendar' && (
          <CalendarView
            applications={applications}
            notificationsEnabled={notifEnabled}
            notificationPermission={permission}
            onToggleNotifications={toggleNotif}
          />
        )}
      </div>

      {modalOpen && (
        <ApplicationModal
          application={editTarget}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {detailTarget && (
        <ApplicationDetailPanel
          application={detailTarget}
          onClose={() => setDetailTarget(null)}
          onStatusChange={handleDetailStatusChange}
          onUpdateDates={handleDetailUpdateDates}
          onEdit={(app) => { setDetailTarget(null); openEdit(app); }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
