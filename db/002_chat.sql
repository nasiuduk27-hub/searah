CREATE TABLE community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX community_messages_gix ON community_messages (community_id, created_at DESC);

INSERT INTO communities (slug, name, moda, corridor) VALUES
  ('bekasi-sudirman-krl', 'Bekasi–Sudirman KRL', 'krl', 'Bekasi-Sudirman'),
  ('bsd-scbd-mobil', 'BSD–SCBD Mobil', 'mobil', 'BSD-SCBD')
ON CONFLICT (slug) DO NOTHING;
