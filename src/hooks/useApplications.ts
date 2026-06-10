import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { JobApplication, ActivityLog, ApplicationStatus, WorkType } from '../types';

function toJobApplication(row: Record<string, unknown>): JobApplication {
  return {
    id: row.id as string,
    company: row.company as string,
    role: row.role as string,
    location: (row.location as string) ?? '',
    workType: (row.work_type as WorkType) ?? 'Remote',
    salaryMin: (row.salary_min as string) ?? '',
    salaryMax: (row.salary_max as string) ?? '',
    status: row.status as ApplicationStatus,
    notes: (row.notes as string) ?? '',
    interviewDates: (row.interview_dates as JobApplication['interviewDates']) ?? [],
    dateApplied: row.date_applied as string,
    createdAt: row.created_at as string,
  };
}

function toDbRow(app: Omit<JobApplication, 'id' | 'createdAt'>) {
  return {
    company: app.company,
    role: app.role,
    location: app.location,
    work_type: app.workType,
    salary_min: app.salaryMin,
    salary_max: app.salaryMax,
    status: app.status,
    notes: app.notes,
    interview_dates: app.interviewDates,
    date_applied: app.dateApplied,
  };
}

function toActivityLog(row: Record<string, unknown>): ActivityLog {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    type: row.type as ActivityLog['type'],
    fromStatus: row.from_status as ApplicationStatus | undefined,
    toStatus: row.to_status as ApplicationStatus | undefined,
    note: row.note as string | undefined,
    createdAt: row.created_at as string,
  };
}

export function useApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setApplications((data ?? []).map(toJobApplication));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const addApplication = useCallback(
    async (app: Omit<JobApplication, 'id' | 'createdAt'>): Promise<string | null> => {
      const { data, error: err } = await supabase
        .from('job_applications')
        .insert(toDbRow(app))
        .select()
        .single();

      if (err) return err.message;

      const newApp = toJobApplication(data);
      setApplications((prev) => [newApp, ...prev]);

      // Log creation
      await supabase.from('activity_logs').insert({
        application_id: newApp.id,
        type: 'created',
        to_status: newApp.status,
      });

      return null;
    },
    []
  );

  const updateApplication = useCallback(
    async (app: JobApplication, prevStatus?: ApplicationStatus): Promise<string | null> => {
      const { error: err } = await supabase
        .from('job_applications')
        .update(toDbRow(app))
        .eq('id', app.id);

      if (err) return err.message;

      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? app : a))
      );

      // Log status change
      if (prevStatus && prevStatus !== app.status) {
        await supabase.from('activity_logs').insert({
          application_id: app.id,
          type: 'status_changed',
          from_status: prevStatus,
          to_status: app.status,
        });
      } else if (!prevStatus) {
        await supabase.from('activity_logs').insert({
          application_id: app.id,
          type: 'updated',
        });
      }

      return null;
    },
    []
  );

  const deleteApplication = useCallback(async (id: string): Promise<string | null> => {
    const { error: err } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id);

    if (err) return err.message;

    setApplications((prev) => prev.filter((a) => a.id !== id));
    return null;
  }, []);

  return {
    applications,
    loading,
    error,
    addApplication,
    updateApplication,
    deleteApplication,
    refreshApplications: fetchApplications,
  };
}

export async function fetchActivityLogs(applicationId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []).map(toActivityLog);
}
