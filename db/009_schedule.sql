-- Jadwal kerja mingguan Fase 3: default jam otomatis untuk offer carpool.
-- ponytail: tanpa sync OAuth dulu (Google/Outlook), add bila dibutuhkan.
CREATE TABLE work_schedules (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  depart_time TIME NOT NULL,
  return_time TIME NOT NULL,
  PRIMARY KEY (user_id, day_of_week)
);
