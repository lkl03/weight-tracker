-- Run this in the Supabase SQL editor to create the table

CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  notes TEXT,
  source VARCHAR(20) NOT NULL DEFAULT 'manual'
    CHECK (source IN ('telegram', 'manual', 'auto-filled', 'import')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_weight_entries_date ON weight_entries (date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_entries_created_at ON weight_entries (created_at DESC);

-- Enable Row Level Security
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

-- Allow read access for anon key (dashboard reads)
CREATE POLICY "Allow anon read" ON weight_entries
  FOR SELECT USING (true);

-- Allow all operations for service role (API writes)
-- Service role bypasses RLS by default in Supabase
