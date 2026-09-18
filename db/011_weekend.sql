-- Aktivitas weekend Fase 4 (PRD 7.2): ekstensi koneksi commuting, BUKAN pool baru.
-- Syarat: trust dari commuting. Lokasi presisi TIDAK disimpan (label area + deal via DM).
CREATE TABLE weekend_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  area_label TEXT NOT NULL CHECK (char_length(area_label) BETWEEN 3 AND 100),
  activity_time TIMESTAMPTZ NOT NULL,
  max_people SMALLINT NOT NULL CHECK (max_people BETWEEN 2 AND 20),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE weekend_participants (
  activity_id UUID NOT NULL REFERENCES weekend_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, user_id)
);
