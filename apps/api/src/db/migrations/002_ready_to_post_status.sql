-- Add ready_to_post status for human-assisted publishing workflow
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN (
  'pending_approval','approved','ready_to_post','rejected',
  'queued','publishing','published','failed'
));
