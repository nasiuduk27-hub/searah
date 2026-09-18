-- SEED DEMO untuk validasi manual (bukan migrasi otomatis).
-- Cara pakai: psql $DATABASE_URL -f db/001_init.sql -f db/002_chat.sql ... -f db/011_weekend.sql -f db/demo.sql
-- Login: OTP dummy 123456 ke nomor di bawah. HAPUS sebelum produksi.
-- ponytail: koordinat asli Jabodetabek, titik publik = offset ±300-500m.

INSERT INTO users (id, phone, phone_verified, name, gender, verification_status) VALUES
  ('11111111-1111-1111-1111-111111111111', '0811000001', TRUE, 'Andi Driver', 'laki-laki', 'verified'),
  ('22222222-2222-2222-2222-222222222222', '0811000002', TRUE, 'Rina Penumpang', 'perempuan', 'verified'),
  ('33333333-3333-3333-3333-333333333333', '0811000003', TRUE, 'Budi KRL', 'laki-laki', 'unverified')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO verification_documents (user_id, doc_type, storage_key, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ktp', 'demo', 'approved'),
  ('11111111-1111-1111-1111-111111111111', 'selfie', 'demo', 'approved'),
  ('22222222-2222-2222-2222-222222222222', 'ktp', 'demo', 'approved'),
  ('22222222-2222-2222-2222-222222222222', 'selfie', 'demo', 'approved')
ON CONFLICT DO NOTHING;

-- Andi: BSD -> SCBD mobil
INSERT INTO trip_points (user_id, destination_type, internal_geom, public_geom, moda, depart_time, return_time) VALUES
  ('11111111-1111-1111-1111-111111111111', 'rumah',
    ST_SetSRID(ST_MakePoint(106.6453, -6.2851), 4326), ST_SetSRID(ST_MakePoint(106.6489, -6.2827), 4326),
    'mobil', '07:00', '17:00'),
  ('11111111-1111-1111-1111-111111111111', 'kantor',
    ST_SetSRID(ST_MakePoint(106.8081, -6.2255), 4326), ST_SetSRID(ST_MakePoint(106.8114, -6.2231), 4326),
    'mobil', '07:00', '17:00'),
-- Rina: BSD -> SCBD mobil (searah Andi)
  ('22222222-2222-2222-2222-222222222222', 'rumah',
    ST_SetSRID(ST_MakePoint(106.6501, -6.2902), 4326), ST_SetSRID(ST_MakePoint(106.6535, -6.2879), 4326),
    'mobil', '07:05', '17:05'),
  ('22222222-2222-2222-2222-222222222222', 'kantor',
    ST_SetSRID(ST_MakePoint(106.8090, -6.2261), 4326), ST_SetSRID(ST_MakePoint(106.8121, -6.2244), 4326),
    'mobil', '07:05', '17:05'),
-- Budi: Bekasi -> Sudirman KRL
  ('33333333-3333-3333-3333-333333333333', 'rumah',
    ST_SetSRID(ST_MakePoint(106.9912, -6.2350), 4326), ST_SetSRID(ST_MakePoint(106.9945, -6.2326), 4326),
    'krl', '06:30', '18:00'),
  ('33333333-3333-3333-3333-333333333333', 'titik_transit',
    ST_SetSRID(ST_MakePoint(106.8231, -6.2003), 4326), ST_SetSRID(ST_MakePoint(106.8264, -6.1981), 4326),
    'krl', '06:30', '18:00');

INSERT INTO community_members (community_id, user_id)
SELECT id, '11111111-1111-1111-1111-111111111111' FROM communities WHERE slug = 'bsd-scbd-mobil'
UNION SELECT id, '22222222-2222-2222-2222-222222222222' FROM communities WHERE slug = 'bsd-scbd-mobil'
UNION SELECT id, '33333333-3333-3333-3333-333333333333' FROM communities WHERE slug = 'bekasi-sudirman-krl'
ON CONFLICT DO NOTHING;

INSERT INTO community_messages (community_id, user_id, body)
SELECT id, '11111111-1111-1111-1111-111111111111', 'Tol dalam kota padat merayap pagi ini' FROM communities WHERE slug = 'bsd-scbd-mobil'
UNION ALL SELECT id, '22222222-2222-2222-2222-222222222222', 'Iya, berangkat 10 menit lebih awal aja' FROM communities WHERE slug = 'bsd-scbd-mobil';

-- Offer + 2 sesi finished + rating mutual (buka jalur trust personal/gamifikasi)
INSERT INTO carpool_offers (id, driver_id, origin_geom, dest_geom, destination_type, moda, seats, depart_time, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
    ST_SetSRID(ST_MakePoint(106.6489, -6.2827), 4326), ST_SetSRID(ST_MakePoint(106.8114, -6.2231), 4326),
    'kantor', 'mobil', 3, now() + interval '1 day', 'open')
ON CONFLICT (id) DO NOTHING;

INSERT INTO carpool_requests (offer_id, passenger_id, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'accepted')
ON CONFLICT DO NOTHING;

INSERT INTO carpool_sessions (id, driver_id, passenger_id, status, started_at, finished_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'finished', now() - interval '2 days', now() - interval '2 days' + interval '1 hour'),
  ('b0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'finished', now() - interval '1 day', now() - interval '1 day' + interval '1 hour')
ON CONFLICT DO NOTHING;

INSERT INTO carpool_ratings (session_id, rater_id, ratee_id, score, review) VALUES
  ('b0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 5, 'Tepat waktu'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 5, 'Nyaman'),
  ('b0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 5, 'Rutin'),
  ('b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 5, 'Rutin')
ON CONFLICT DO NOTHING;

INSERT INTO user_interests (user_id, interest) VALUES
  ('11111111-1111-1111-1111-111111111111', 'kopi'),
  ('22222222-2222-2222-2222-222222222222', 'kopi');
