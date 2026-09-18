import { Controller, Get, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

// Gamifikasi pribadi saja: streak + badge dari data existing, TANPA leaderboard
// (guardrail anti-ojek-online PRD 5.2.3 — tidak ada peringkat "paling banyak antar orang").
@Controller('/gamifikasi')
export class GamifikasiController {
  @Get('/me')
  async me(@Req() req: any) {
    const id = authUserId(req);
    const { rows: days } = await pool.query(
      `SELECT DISTINCT d::date AS day FROM (
         SELECT finished_at AS d FROM carpool_sessions
         WHERE (driver_id = $1 OR passenger_id = $1) AND status = 'finished' AND finished_at IS NOT NULL
         UNION SELECT created_at AS d FROM community_messages WHERE user_id = $1
       ) t WHERE d IS NOT NULL ORDER BY day DESC`,
      [id],
    );
    const set = new Set(days.map((r: any) => new Date(r.day).toISOString().slice(0, 10)));
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const today = new Date();
    let cursor = set.has(fmt(today)) ? today : new Date(today.getTime() - 86400000);
    let streak = 0;
    while (set.has(fmt(cursor))) {
      streak++;
      cursor = new Date(cursor.getTime() - 86400000);
    }
    const { rows: s } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM carpool_sessions
       WHERE (driver_id = $1 OR passenger_id = $1) AND status = 'finished'`,
      [id],
    );
    const badges: string[] = [];
    if (streak >= 3) badges.push('komuter_3_hari');
    if (streak >= 7) badges.push('komuter_7_hari');
    if (set.size >= 7) badges.push('warga_aktif');
    if (s[0].n >= 5) badges.push('carpool_5');
    if (s[0].n >= 10) badges.push('carpool_10');
    return { streak_days: streak, active_days: set.size, finished_sessions: s[0].n, badges };
  }
}
