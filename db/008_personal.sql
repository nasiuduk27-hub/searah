-- Kecocokan personal Fase 3 (PRD 5.2.4): progresi dari histori searah, BUKAN swipe terbuka.
-- Kandidat hanya muncul bila trust terpenuhi; identitas hanya terbuka bila mutual.
CREATE TABLE user_interests (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest TEXT NOT NULL CHECK (char_length(interest) BETWEEN 2 AND 30),
  PRIMARY KEY (user_id, interest)
);

CREATE TABLE personal_interests (
  from_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (from_id, to_id),
  CHECK (from_id <> to_id)
);
