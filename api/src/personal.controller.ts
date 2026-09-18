import { Body, Controller, ForbiddenException, Get, Param, Post, Put, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

// Syarat trust kecocokan personal: terverifikasi + min 2 sesi finished + rata-rata rating >= 4.
const TRUST_SQL = `u.verification_status = 'verified'
  AND (SELECT COUNT(*) FROM carpool_sessions s WHERE (s.driver_id = u.id OR s.passenger_id = u.id) AND s.status = 'finished') >= 2
  AND COALESCE((SELECT AVG(score) FROM carpool_ratings WHERE ratee_id = u.id), 5) >= 4`;

@Controller('/personal')
export class PersonalController {
  @Put('/interests')
  async set(@Req() req: any, @Body() b: { interests: string[] }) {
    const me = authUserId(req);
    const list = [...new Set((b?.interests ?? []).map((s) => String(s).trim().toLowerCase()).filter((s) => s.length >= 2 && s.length <= 30))].slice(0, 20);
    await pool.query(`DELETE FROM user_interests WHERE user_id = $1`, [me]);
    for (const i of list) await pool.query(`INSERT INTO user_interests VALUES ($1, $2)`, [me, i]);
    return { ok: true, interests: list };
  }

  @Get('/interests')
  async mine(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(`SELECT interest FROM user_interests WHERE user_id = $1`, [me]);
    return rows.map((r: any) => r.interest);
  }

  // Kandidat: sekomunitas + minat sama + trust + belum pernah dinyatakan tertarik + tidak diblokir.
  @Get('/candidates')
  async candidates(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT DISTINCT u.id, u.name,
        (SELECT COUNT(*)::int FROM user_interests i2 WHERE i2.user_id = u.id
          AND i2.interest IN (SELECT interest FROM user_interests WHERE user_id = $1)) AS shared
       FROM users u
       WHERE u.id <> $1 AND ${TRUST_SQL}
         AND EXISTS (SELECT 1 FROM community_members m1 JOIN community_members m2
           ON m1.community_id = m2.community_id WHERE m1.user_id = $1 AND m2.user_id = u.id)
         AND EXISTS (SELECT 1 FROM user_interests i WHERE i.user_id = u.id
           AND i.interest IN (SELECT interest FROM user_interests WHERE user_id = $1))
         AND NOT EXISTS (SELECT 1 FROM personal_interests p WHERE p.from_id = $1 AND p.to_id = u.id)
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = $1))
       ORDER BY shared DESC LIMIT 20`,
      [me],
    );
    return rows;
  }

  @Post('/interest/:userId')
  async express(@Req() req: any, @Param('userId') peer: string) {
    const me = authUserId(req);
    if (me === peer) throw new ForbiddenException('target invalid');
    await pool.query(`INSERT INTO personal_interests (from_id, to_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [me, peer]);
    const { rows } = await pool.query(
      `SELECT 1 FROM personal_interests WHERE from_id = $1 AND to_id = $2`, [peer, me],
    );
    return { ok: true, mutual: !!rows[0] };
  }

  @Get('/mutual')
  async mutual(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT u.id, u.name FROM personal_interests p1
       JOIN personal_interests p2 ON p1.to_id = p2.from_id AND p1.from_id = p2.to_id
       JOIN users u ON u.id = p1.to_id
       WHERE p1.from_id = $1`,
      [me],
    );
    return rows;
  }
}
