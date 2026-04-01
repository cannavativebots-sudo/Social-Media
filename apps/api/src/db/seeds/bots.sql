INSERT INTO bots (role, name, is_enabled, config) VALUES
  ('director',             'Director',             true,  '{"model":"claude-opus-4-6"}'),
  ('social_media_manager', 'Social Media Manager', true,  '{"model":"claude-opus-4-6"}'),
  ('instagram',            'Instagram Bot',        true,  '{"model":"claude-opus-4-6"}'),
  ('facebook',             'Facebook Bot',         true,  '{"model":"claude-opus-4-6"}'),
  ('x',                    'X Bot',                false, '{"disabled_reason":"Not configured yet — Phase 2"}'),
  ('content_creator',      'Content Creator',      true,  '{"model":"claude-opus-4-6"}'),
  ('scheduler',            'Scheduler',            true,  '{"model":"claude-opus-4-6"}'),
  ('website_manager',      'Website Manager',      false, '{"disabled_reason":"Phase 2"}')
ON CONFLICT (role) DO NOTHING;

INSERT INTO platform_connections (platform, is_connected) VALUES
  ('facebook',  false),
  ('instagram', false),
  ('x',         false),
  ('website',   false)
ON CONFLICT (platform) DO NOTHING;
