-- Carpool Fase 2 (PRD 5.2.1): posting → discover → request → accept/decline.
-- Hanya titik publik yang disimpan/ditampilkan. Tanpa tarif (split cost via chat).
CREATE TABLE carpool_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin_geom geography(Point, 4326) NOT NULL,
  dest_geom geography(Point, 4326) NOT NULL,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('rumah','kantor','titik_transit')),
  moda TEXT NOT NULL CHECK (moda IN ('mobil','motor')),
  seats SMALLINT NOT NULL CHECK (seats BETWEEN 1 AND 7),
  depart_time TIMESTAMPTZ,
  has_spare_helmet BOOLEAN,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((moda = 'motor' AND has_spare_helmet IS NOT NULL) OR moda = 'mobil')
);

CREATE TABLE carpool_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES carpool_offers(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (offer_id, passenger_id)
);
CREATE INDEX carpool_offers_gix ON carpool_offers USING GIST (origin_geom);
