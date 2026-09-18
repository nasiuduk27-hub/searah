-- SOS + share trip Fase 2 (PRD 6.4, 6.5). Web: GPS hanya jalan saat tab/PWA aktif.
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE share_tokens (
  token TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  session_id UUID NOT NULL REFERENCES carpool_sessions(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '12 hours',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE location_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES carpool_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  geom geography(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX location_pings_six ON location_pings (session_id, created_at DESC);

CREATE TABLE sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES carpool_sessions(id) ON DELETE SET NULL,
  geom geography(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
