-- Verifikasi kendaraan Fase 2 (PRD 6.7): STNK + foto kendaraan, review manual.
-- File terenkripsi, publik hanya badge.
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_status TEXT NOT NULL DEFAULT 'unverified'
  CHECK (vehicle_status IN ('unverified','pending','verified','rejected'));

CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('stnk','foto_kendaraan','plat')),
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, doc_type)
);
