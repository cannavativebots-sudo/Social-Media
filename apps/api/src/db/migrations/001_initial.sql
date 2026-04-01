-- Bot registry
CREATE TABLE IF NOT EXISTS bots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'idle'
                   CHECK (status IN ('idle','running','error','disabled')),
  is_enabled   BOOLEAN NOT NULL DEFAULT true,
  config       JSONB NOT NULL DEFAULT '{}',
  error_msg    TEXT,
  last_run_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform connections (FB, IG, X, website)
CREATE TABLE IF NOT EXISTS platform_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      TEXT NOT NULL UNIQUE
                    CHECK (platform IN ('instagram','facebook','x','website')),
  is_connected  BOOLEAN NOT NULL DEFAULT false,
  access_token  TEXT,
  account_id    TEXT,
  account_name  TEXT,
  last_checked  TIMESTAMPTZ,
  error_msg     TEXT,
  meta          JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post queue
CREATE TABLE IF NOT EXISTS posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform         TEXT NOT NULL CHECK (platform IN ('instagram','facebook','x')),
  status           TEXT NOT NULL DEFAULT 'pending_approval'
                       CHECK (status IN (
                         'pending_approval','approved','rejected',
                         'queued','publishing','published','failed'
                       )),
  caption          TEXT,
  hashtags         TEXT[] NOT NULL DEFAULT '{}',
  media_urls       TEXT[] NOT NULL DEFAULT '{}',
  scheduled_for    TIMESTAMPTZ,
  published_at     TIMESTAMPTZ,
  platform_post_id TEXT,
  approved_by      TEXT,
  created_by_bot   TEXT REFERENCES bots(role) ON DELETE SET NULL,
  retry_count      INT NOT NULL DEFAULT 0,
  error_msg        TEXT,
  meta             JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level      TEXT NOT NULL CHECK (level IN ('info','warn','error','debug')),
  bot_role   TEXT REFERENCES bots(role) ON DELETE SET NULL,
  message    TEXT NOT NULL,
  context    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_status    ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_platform  ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_created    ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_bot        ON logs(bot_role);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bots_updated_at  ON bots;
DROP TRIGGER IF EXISTS posts_updated_at ON posts;
DROP TRIGGER IF EXISTS platform_connections_updated_at ON platform_connections;

CREATE TRIGGER bots_updated_at
  BEFORE UPDATE ON bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER platform_connections_updated_at
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
