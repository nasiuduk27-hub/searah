-- Verifikasi email kantor Fase 2 (PRD 6.2): opsional, badge trust tambahan.
ALTER TABLE users ADD COLUMN IF NOT EXISTS office_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS office_email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS office_email_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS office_email_token_expires TIMESTAMPTZ;
