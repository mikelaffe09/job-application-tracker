import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Bell, BellOff, X, Clock, CalendarDays } from 'lucide-react';
import type { JobApplication } from '../types';
import StatusBadge from './StatusBadge';

interface CalendarViewProps {
  applications: JobApplication[];
  notificationsEnabled: boolean;
  notificationPermission: string;
  onToggleNotifications: () => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayEvent {
  application: JobApplication;
  interview: { id: string; date: string; label: string };
}

function buildEventMap(applications: JobApplication[]): Map<string, DayEvent[]> {
  const map = new Map<string, DayEvent[]>();
  for (const app of applications) {
    for (const interview of app.interviewDates) {
      if (!interview.date) continue;
      const d = new Date(interview.date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ application: app, interview });
    }
  }
  return map;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatFullDate(year: number, month: number, day: number) {
  const d = new Date(year, month, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function CalendarView({
  applications,
  notificationsEnabled,
  notificationPermission,
  onToggleNotifications,
}: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<{ day: number; events: DayEvent[] } | null>(null);

  const eventMap = buildEventMap(applications);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const handleDayClick = (day: number) => {
    const key = `${year}-${month}-${day}`;
    const events = eventMap.get(key);
    if (events && events.length > 0) {
      setSelectedDay({ day, events });
    }
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const getEvents = (day: number): DayEvent[] =>
    eventMap.get(`${year}-${month}-${day}`) ?? [];

  const notifDenied = notificationPermission === 'denied';
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="flex flex-col gap-6">
      {/* Notification toggle */}
      <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-slate-900">Interview Reminders</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {notifDenied
              ? 'Notifications blocked in browser settings'
              : 'Get notified 1 hour before interviews'}
          </p>
        </div>
        <button
          onClick={onToggleNotifications}
          disabled={notifDenied}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            notificationsEnabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {notificationsEnabled ? (
            <><Bell className="w-4 h-4" /> On</>
          ) : (
            <><BellOff className="w-4 h-4" /> Off</>
          )}
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-slate-900">
              {MONTH_NAMES[month]} {year}
            </h3>
            {!isCurrentMonth && (
              <button
                onClick={goToToday}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {DAY_NAMES_SHORT.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[80px] sm:min-h-[100px] border-b border-r border-slate-50 bg-slate-50/40"
                />
              );
            }
            const todayCell = isToday(day);
            const events = getEvents(day);
            const hasEvents = events.length > 0;
            const visible = events.slice(0, 2);
            const overflow = events.length - 2;

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`min-h-[80px] sm:min-h-[100px] flex flex-col border-b border-r border-slate-50 p-1 sm:p-1.5 transition-colors ${
                  hasEvents ? 'cursor-pointer hover:bg-blue-50/60' : 'cursor-default'
                } ${todayCell ? 'bg-blue-50/30' : ''}`}
              >
                {/* Day number */}
                <div className="flex justify-center mb-1">
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      todayCell
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600'
                    }`}
                  >
                    {day}
                  </span>
                </div>

                {/* Event chips */}
                <div className="space-y-0.5 flex-1">
                  {visible.map(({ interview, application }) => (
                    <div
                      key={interview.id}
                      className="px-1 py-0.5 rounded text-[10px] leading-tight font-medium bg-amber-100 text-amber-800 truncate hidden sm:block"
                      title={`${interview.label} — ${application.role} at ${application.company} · ${formatTime(interview.date)}`}
                    >
                      {interview.label}
                    </div>
                  ))}
                  {/* Mobile: just show a dot */}
                  {hasEvents && (
                    <div className="sm:hidden flex justify-center mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 block" />
                    </div>
                  )}
                  {overflow > 0 && (
                    <p className="text-[10px] text-slate-400 pl-1 hidden sm:block">+{overflow} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events list */}
      <UpcomingList applications={applications} />

      {/* Day detail modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedDay(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {DAY_NAMES_FULL[new Date(year, month, selectedDay.day).getDay()]}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {MONTH_NAMES[month]} {selectedDay.day}, {year}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Events */}
            <div className="overflow-y-auto p-4 space-y-3">
              {selectedDay.events.map(({ application, interview }) => (
                <div key={interview.id} className="border border-slate-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{application.role}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{application.company}</p>
                    </div>
                    <StatusBadge status={application.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">{interview.label}</span>
                      <span className="mx-1.5 text-amber-400">·</span>
                      <span>{formatTime(interview.date)}</span>
                    </div>
                  </div>

                  {(application.location || application.workType) && (
                    <p className="text-xs text-slate-500">
                      {[application.workType, application.location].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UpcomingList({ applications }: { applications: JobApplication[] }) {
  const now = new Date();
  const upcoming: { app: JobApplication; interview: { id: string; date: string; label: string } }[] = [];

  for (const app of applications) {
    for (const interview of app.interviewDates) {
      if (!interview.date) continue;
      const d = new Date(interview.date);
      if (!isNaN(d.getTime()) && d >= now) {
        upcoming.push({ app, interview });
      }
    }
  }

  upcoming.sort((a, b) => new Date(a.interview.date).getTime() - new Date(b.interview.date).getTime());

  if (upcoming.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-2 text-center">
        <CalendarDays className="w-8 h-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">No upcoming interviews</p>
        <p className="text-xs text-slate-400">Add interview dates to applications to see them here</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">
        Upcoming Interviews
        <span className="ml-2 text-xs font-normal text-slate-400">({upcoming.length})</span>
      </h4>
      <div className="space-y-0">
        {upcoming.slice(0, 8).map(({ app, interview }, idx) => {
          const d = new Date(interview.date);
          const isThisWeek = d.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;
          return (
            <div
              key={interview.id}
              className={`flex items-center gap-4 py-3 ${idx < upcoming.slice(0, 8).length - 1 ? 'border-b border-slate-50' : ''}`}
            >
              {/* Date block */}
              <div className={`w-10 flex-shrink-0 text-center rounded-xl py-1.5 ${isThisWeek ? 'bg-amber-50' : 'bg-slate-50'}`}>
                <p className={`text-xs font-bold leading-none ${isThisWeek ? 'text-amber-700' : 'text-slate-600'}`}>
                  {d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                </p>
                <p className={`text-lg font-bold leading-tight ${isThisWeek ? 'text-amber-800' : 'text-slate-800'}`}>
                  {d.getDate()}
                </p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {app.role} <span className="text-slate-400 font-normal">at {app.company}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {interview.label} · {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>

              {isThisWeek && (
                <span className="flex-shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  This week
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
