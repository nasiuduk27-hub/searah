import { Body, Controller, ForbiddenException, Get, Post, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

// Rating HANYA untuk sesi carpool yang di-accept & selesai (PRD 5.2.2).
// Sesi dibuat di Fase 2 (posting-accept); endpoint ini tidak membuat sesi.
@Controller('/ratings')
export class RatingsController {
  @Post()
  async rate(@Req() req: any, @Body() b: { session_id: string; score: number; review?: string }) {
    const me = authUserId(req);
    const score = Number(b?.score);
    if (!b?.session_id || !(score >= 1 && score <= 5)) throw new ForbiddenException('session/score invalid');
    const { rows } = await pool.query(`SELECT * FROM carpool_sessions WHERE id = $1`, [b.session_id]);
    const s = rows[0];
    if (!s || s.status !== 'finished') throw new ForbiddenException('sesi belum selesai');
    if (s.driver_id !== me && s.passenger_id !== me) throw new ForbiddenException('bukan peserta sesi');
    const ratee = s.driver_id === me ? s.passenger_id : s.driver_id;
    await pool.query(
      `INSERT INTO carpool_ratings (session_id, rater_id, ratee_id, score, review)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (session_id, rater_id) DO UPDATE SET score = EXCLUDED.score, review = EXCLUDED.review`,
      [b.session_id, me, ratee, score, (b.review ?? '').slice(0, 500)],
    );
    return { ok: true };
  }

  @Get('/received')
  async received(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT AVG(score)::float AS avg, COUNT(*)::int AS n FROM carpool_ratings WHERE ratee_id = $1`,
      [me],
    );
    return rows[0];
  }
}
