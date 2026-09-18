-- SEARAH MVP init — PostgreSQL + PostGIS
-- Privasi: internal_geom (presisi, hanya backend) vs public_geom (kabur 300-500m, untuk user lain)
-- destination_type generik: rumah | kantor | titik_transit (PRD 5.1.2, bukan hardcode kantor)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('perempuan','laki-laki','lainnya')),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  trust_level INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verifikasi Tingkat 1: foto KTP + selfie, review manual (PRD 9.1). Storage key menunjuk objek terenkripsi di S3.
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('ktp','selfie')),
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, doc_type)
);

CREATE TABLE trip_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('rumah','kantor','titik_transit')),
  internal_geom geography(Point, 4326) NOT NULL,
  public_geom geography(Point, 4326) NOT NULL,
  moda TEXT NOT NULL CHECK (moda IN ('mobil','motor','krl','bus','jalan_kaki')),
  depart_time TIME,
  return_time TIME,
  max_detour_minutes INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trip_points_internal_gix ON trip_points USING GIST (internal_geom);
CREATE INDEX trip_points_public_gix ON trip_points USING GIST (public_geom);

-- Teman ngobrol: grup komunitas terbuka, tanpa accept (PRD 5.2)
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moda TEXT NOT NULL,
  corridor TEXT NOT NULL
);

CREATE TABLE community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

-- Report/block sejak MVP pertama (PRD 9.2)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('pelecehan','penipuan','akun_palsu','spam','lainnya')),
  detail TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','actioned','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reporter_id <> reported_id)
);

CREATE TABLE blocks (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- Carpool Fase 2, tabel disiapkan minimal agar rating (MVP) jelas cakupannya:
-- rating HANYA untuk sesi carpool yang di-accept & selesai (PRD 5.2.2)
CREATE TABLE carpool_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id),
  passenger_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted','ongoing','finished','cancelled')),
  has_spare_helmet BOOLEAN,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  CHECK (driver_id <> passenger_id)
);

CREATE TABLE carpool_ratings (
  session_id UUID NOT NULL REFERENCES carpool_sessions(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  review TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, rater_id),
  CHECK (rater_id <> ratee_id)
);
