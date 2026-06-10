export type ApplicationStatus =
  | 'Applied'
  | 'Interview'
  | 'Technical Test'
  | 'Offer'
  | 'Rejected';

export type WorkType = 'Remote' | 'Hybrid' | 'On-site';

export interface InterviewDate {
  id: string;
  date: string; // ISO string
  label: string;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  location: string;
  workType: WorkType;
  salaryMin: string;
  salaryMax: string;
  status: ApplicationStatus;
  notes: string;
  interviewDates: InterviewDate[];
  dateApplied: string; // ISO date string YYYY-MM-DD
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  applicationId: string;
  type: 'created' | 'status_changed' | 'updated';
  fromStatus?: ApplicationStatus;
  toStatus?: ApplicationStatus;
  note?: string;
  createdAt: string;
}

export interface Nudge {
  applicationId: string;
  type: 'follow_up' | 'check_in';
  message: string;
  daysStale: number;
  application: JobApplication;
}

export type AppView = 'dashboard' | 'calendar' | 'kanban';
