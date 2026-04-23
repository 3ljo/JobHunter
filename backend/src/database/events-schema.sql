-- EVENTS TABLE (Hired & Help instrumentation, 2026-04)
-- Single table for the 10 referral-funnel events. Keeps the funnel view
-- trivially queryable (GROUP BY event_name), avoids an ORM, and the
-- JSONB metadata column absorbs future event shape changes without a
-- migration. Partition later if volume becomes a problem.

BEGIN;

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funnel queries will always be (event_name, created_at range). Separate
-- indexes are fine here — we don't need a composite.
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

-- No RLS read policy — only the backend (service role) and the admin
-- email allowlist query this. Enable RLS to lock anon out.
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

COMMIT;
