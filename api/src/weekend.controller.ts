import { Body, Controller, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

// Host wajib trust commuting: terverifikasi + min 2 sesi finished + rating >= 4.
async function requireHostTrust(userId: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT verification_status FROM users WHERE id = $1`, [userId],
  );
  if (rows[0]?.verification_status !== 'verified')
    throw new ForbiddenException('host wajib terverifikasi');
  const { rows: s } = await pool.query(
    `SELECT COUNT(*)::int AS n, COALESCE((SELECT AVG(score) FROM carpool_ratings WHERE ratee_id = $1), 5)::float AS avg
     FROM carpool_sessions WHERE (driver_id = $1 OR passenger_id = $1) AND status = 'finished'`,
    [userId],
  );
  if (s[0].n < 2 || s[0].avg < 4)
    throw new ForbiddenException('butuh min 2 sesi selesai dengan rating baik');
}

async function sameCommunity(a: string, b: string, communityId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM community_members m1 JOIN community_members m2 USING (community_id)
     WHERE m1.user_id = $1 AND m2.user_id = $2 AND m1.community_id = $3`,
    [a, b, communityId],
  );
  return !!rows[0];
}

@Controller('/weekend')
export class WeekendController {
  @Post()
  async post(
    @Req() req: any,
    @Body() b: { community_id: string; title: string; area_label: string; activity_time: string; max_people: number },
  ) {
    const me = authUserId(req);
    await requireHostTrust(me);
    if (!b?.community_id) throw new ForbiddenException('komunitas wajib');
    if ((b.title ?? '').trim().length < 3 || (b.area_label ?? '').trim().length < 3)
      throw new ForbiddenException('judul dan label area wajib');
    const t = new Date(b.activity_time);
    if (isNaN(+t) || t.getTime() < Date.now()) throw new ForbiddenException('waktu harus masa depan');
    const max = Number(b.max_people);
    if (!(max >= 2 && max <= 20)) throw new ForbiddenException('peserta 2-20');
    const { rows: m } = await pool.query(
      `SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2`, [b.community_id, me],
    );
    if (!m[0]) throw new ForbiddenException('host harus anggota komunitas itu');
    const { rows } = await pool.query(
      `INSERT INTO weekend_activities (host_id, community_id, title, area_label, activity_time, max_people)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [me, b.community_id, b.title.trim().slice(0, 100), b.area_label.trim().slice(0, 100), t.toISOString(), max],
    );
    return rows[0];
  }

  // Hanya aktivitas dari komunitas yang saya ikuti (bukan pool terbuka).
  @Get()
  async list(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.area_label, a.activity_time, a.max_people, u.name AS host,
        (SELECT COUNT(*)::int FROM weekend_participants p WHERE p.activity_id = a.id AND p.status = 'accepted') AS joined
       FROM weekend_activities a JOIN users u ON u.id = a.host_id
       WHERE a.status = 'open' AND a.activity_time > now() AND a.host_id <> $1
         AND EXISTS (SELECT 1 FROM community_members m1 JOIN community_members m2 USING (community_id)
           WHERE m1.user_id = $1 AND m2.user_id = a.host_id)
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = a.host_id) OR (b.blocker_id = a.host_id AND b.blocked_id = $1))
       ORDER BY a.activity_time ASC LIMIT 30`,
      [me],
    );
    return rows;
  }

  @Post('/:id/request')
  async request(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    const { rows } = await pool.query(`SELECT * FROM weekend_activities WHERE id = $1`, [id]);
    const a = rows[0];
    if (!a || a.status !== 'open') throw new ForbiddenException('aktivitas tidak tersedia');
    if (!(await sameCommunity(me, a.host_id, a.community_id)))
      throw new ForbiddenException('hanya untuk sekomunitas commuting');
    try {
      await pool.query(`INSERT INTO weekend_participants (activity_id, user_id) VALUES ($1, $2)`, [id, me]);
    } catch {
      throw new ForbiddenException('sudah request');
    }
    return { ok: true };
  }

  @Get('/requests/incoming')
  async incoming(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT p.activity_id, p.user_id, u.name FROM weekend_participants p
       JOIN weekend_activities a ON a.id = p.activity_id JOIN users u ON u.id = p.user_id
       WHERE a.host_id = $1 AND p.status = 'pending' ORDER BY p.created_at ASC`,
      [me],
    );
    return rows;
  }

  @Post('/participants/accept')
  async accept(@Req() req: any, @Body() b: { activity_id: string; user_id: string }) {
    const me = authUserId(req);
    const { rows } = await pool.query(`SELECT * FROM weekend_activities WHERE id = $1 AND host_id = $2`, [b.activity_id, me]);
    if (!rows[0]) throw new ForbiddenException('bukan aktivitas kamu');
    const { rows: cnt } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM weekend_participants WHERE activity_id = $1 AND status = 'accepted'`, [b.activity_id],
    );
    if (cnt[0].n >= rows[0].max_people) throw new ForbiddenException('penuh');
    await pool.query(
      `UPDATE weekend_participants SET status = 'accepted' WHERE activity_id = $1 AND user_id = $2`,
      [b.activity_id, b.user_id],
    );
    return { ok: true };
  }

  @Post('/participants/decline')
  async decline(@Req() req: any, @Body() b: { activity_id: string; user_id: string }) {
    const me = authUserId(req);
    await pool.query(
      `UPDATE weekend_participants p SET status = 'declined' FROM weekend_activities a
       WHERE a.id = p.activity_id AND a.id = $1 AND a.host_id = $2 AND p.user_id = $3`,
      [b.activity_id, me, b.user_id],
    );
    return { ok: true };
  }
}
