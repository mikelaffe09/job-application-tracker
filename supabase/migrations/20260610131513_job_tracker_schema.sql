/*
# Job Tracker Schema — Multi-user with Activity Logs

## Summary
Creates two tables to support a multi-user job application tracker with
full activity history.

## New Tables

### job_applications
Stores each user's job applications. All fields mirror the existing
localStorage schema so existing client code maps cleanly.
- id (uuid, PK)
- user_id (uuid, FK → auth.users, defaults to auth.uid())
- company (text)
- role (text)
- location (text)
- work_type (text — Remote | Hybrid | On-site)
- salary_min (text)
- salary_max (text)
- status (text — Applied | Interview | Technical Test | Offer | Rejected)
- notes (text)
- interview_dates (jsonb — array of {id, date, label})
- date_applied (date)
- created_at (timestamptz)

### activity_logs
Tracks every meaningful change to an application (created, status changed,
updated). Used for the activity timeline shown per card and for computing
follow-up nudges.
- id (uuid, PK)
- application_id (uuid, FK → job_applications)
- user_id (uuid, FK → auth.users, defaults to auth.uid())
- type (text — created | status_changed | updated)
- from_status (text, nullable)
- to_status (text, nullable)
- note (text, nullable)
- created_at (timestamptz)

## Security
- RLS enabled on both tables.
- Authenticated users can only SELECT / INSERT / UPDATE / DELETE their own rows.
- user_id defaults to auth.uid() so clients never need to pass it explicitly.

## Indexes
- idx_job_applications_user_id — fast per-user app listing
- idx_activity_logs_application_id — fast timeline loads per application
- idx_activity_logs_user_id — fast per-user log queries
*/

-- ─── job_applications ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS job_applications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL DEFAULT auth.uid()
                   REFERENCES auth.users(id) ON DELETE CASCADE,
  company        text NOT NULL,
  role           text NOT NULL,
  location       text NOT NULL DEFAULT '',
  work_type      text NOT NULL DEFAULT 'Remote',
  salary_min     text NOT NULL DEFAULT '',
  salary_max     text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'Applied',
  notes          text NOT NULL DEFAULT '',
  interview_dates jsonb NOT NULL DEFAULT '[]'::jsonb,
  date_applied   date NOT NULL DEFAULT CURRENT_DATE,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_id
  ON job_applications(user_id);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_apps" ON job_applications;
CREATE POLICY "select_own_apps" ON job_applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_apps" ON job_applications;
CREATE POLICY "insert_own_apps" ON job_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_apps" ON job_applications;
CREATE POLICY "update_own_apps" ON job_applications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_apps" ON job_applications;
CREATE POLICY "delete_own_apps" ON job_applications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


-- ─── activity_logs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL
                   REFERENCES job_applications(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL DEFAULT auth.uid()
                   REFERENCES auth.users(id) ON DELETE CASCADE,
  type           text NOT NULL,
  from_status    text,
  to_status      text,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_application_id
  ON activity_logs(application_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON activity_logs(user_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_logs" ON activity_logs;
CREATE POLICY "select_own_logs" ON activity_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_logs" ON activity_logs;
CREATE POLICY "insert_own_logs" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_logs" ON activity_logs;
CREATE POLICY "delete_own_logs" ON activity_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
