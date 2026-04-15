-- Strategy reports — saved recommendations from MarketingStrategistBot
CREATE TABLE IF NOT EXISTS strategy_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_bot TEXT REFERENCES bots(role) ON DELETE SET NULL,
  report         JSONB NOT NULL DEFAULT '{}',
  summary        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_reports_created ON strategy_reports(created_at DESC);
