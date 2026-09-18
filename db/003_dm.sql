-- Chat 1-on-1 Fase 2: hanya untuk yang sudah terverifikasi (PRD 6.3 Grup Dulu, Personal Kemudian).
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> receiver_id)
);
CREATE INDEX direct_messages_pair_idx ON direct_messages (sender_id, receiver_id, created_at DESC);
