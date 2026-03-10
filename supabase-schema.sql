-- Run this in the Supabase SQL editor after creating your project

-- Owl status table
-- We INSERT a new row each time the status changes (append-only log).
-- The current status is always the latest row.
CREATE TABLE IF NOT EXISTS owl_status (
  id         BIGSERIAL PRIMARY KEY,
  status     TEXT NOT NULL CHECK (status IN ('YES', 'NO', 'MISTY')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with initial status
INSERT INTO owl_status (status) VALUES ('MISTY');

-- Enable Row Level Security
ALTER TABLE owl_status ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the owl status
CREATE POLICY "Public read owl_status"
  ON owl_status FOR SELECT
  USING (true);

-- Only service role (server-side API) can insert — no direct client writes
-- (The anon key cannot insert; only our API with service role key can)

-- Enable Realtime for this table
-- (You also need to enable Realtime in the Supabase dashboard for owl_status)
ALTER PUBLICATION supabase_realtime ADD TABLE owl_status;
