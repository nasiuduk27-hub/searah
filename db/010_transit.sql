-- Jadwal transit statis Fase 3 (PRD 7.1): pelengkap, update manual dari GAPEKA.
-- ponytail: seed sampel koridor awal; GTFS TransJakarta asli menyusul bila perlu.
CREATE TABLE transit_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('krl','busway')),
  corridor TEXT NOT NULL
);

CREATE TABLE transit_departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id UUID NOT NULL REFERENCES transit_stops(id) ON DELETE CASCADE,
  day_type TEXT NOT NULL CHECK (day_type IN ('weekday','weekend')),
  depart_time TIME NOT NULL
);
CREATE INDEX transit_dep_idx ON transit_departures (stop_id, day_type, depart_time);
DO $$ BEGIN
  ALTER TABLE transit_departures ADD CONSTRAINT transit_dep_unique UNIQUE (stop_id, day_type, depart_time);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO transit_stops (code, name, mode, corridor) VALUES
  ('BKS', 'Bekasi', 'krl', 'Bekasi-Sudirman'),
  ('KRI', 'Kranji', 'krl', 'Bekasi-Sudirman'),
  ('MRI', 'Manggarai', 'krl', 'Bekasi-Sudirman'),
  ('SUD', 'Sudirman', 'krl', 'Bekasi-Sudirman'),
  ('BSD1', 'BSD City', 'busway', 'BSD-SCBD'),
  ('SCBD1', 'SCBD', 'busway', 'BSD-SCBD')
ON CONFLICT (code) DO NOTHING;

-- Sampel weekday pagi (WIB). Sesuaikan manual dari jadwal resmi.
INSERT INTO transit_departures (stop_id, day_type, depart_time)
SELECT id, 'weekday', t FROM transit_stops, (VALUES ('06:05'),('06:20'),('06:35'),('06:50'),('07:05'),('07:20'),('17:10'),('17:30'),('17:50'),('18:10')) AS v(t)
WHERE code IN ('BKS','KRI','MRI','SUD','BSD1','SCBD1')
ON CONFLICT ON CONSTRAINT transit_dep_unique DO NOTHING;
