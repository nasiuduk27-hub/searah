import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

// Tingkat 2: posting/request/accept carpool wajib terverifikasi (PRD 9.1).
async function requireVerified(userId: string): Promise<void> {
  const { rows } = await pool.query(`SELECT verification_status FROM users WHERE id = $1`, [userId]);
  if (rows[0]?.verification_status !== 'verified')
    throw new ForbiddenException('carpool wajib verifikasi KTP+selfie dulu');
}

function fuzz(lat: number, lng: number): { lat: number; lng: number } {
  const dist = 300 + Math.random() * 200;
  const brg = Math.random() * 2 * Math.PI;
  const R = 6371000;
  const d = dist / R;
  const la1 = (lat * Math.PI) / 180;
  const lo1 = (lng * Math.PI) / 180;
  const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(brg));
  const lo2 = lo1 + Math.atan2(Math.sin(brg) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
  return { lat: (la2 * 180) / Math.PI, lng: (lo2 * 180) / Math.PI };
}

@Controller('/carpool')
export class CarpoolController {
  @Post('/offers')
  async post(
    @Req() req: any,
    @Body()
    b: {
      origin_lat: number; origin_lng: number; dest_lat: number; dest_lng: number;
      destination_type: string; moda: string; seats: number; depart_time?: string;
      has_spare_helmet?: boolean;
    },
  ) {
    const me = authUserId(req);
    await requireVerified(me);
    if (!['mobil', 'motor'].includes(b?.moda)) throw new ForbiddenException('moda harus mobil/motor');
    if (!['rumah', 'kantor', 'titik_transit'].includes(b?.destination_type))
      throw new ForbiddenException('destination_type invalid');
    const seats = Number(b?.seats);
    if (!(seats >= 1 && seats <= 7)) throw new ForbiddenException('kursi 1-7');
    if (b.moda === 'motor' && typeof b.has_spare_helmet !== 'boolean')
      throw new ForbiddenException('wajib isi punya helm cadangan (Ya/Tidak)');
    for (const v of [b.origin_lat, b.origin_lng, b.dest_lat, b.dest_lng])
      if (typeof v !== 'number' || !isFinite(v)) throw new ForbiddenException('koordinat wajib angka');
    const o = fuzz(b.origin_lat, b.origin_lng);
    const d = fuzz(b.dest_lat, b.dest_lng);
    const { rows } = await pool.query(
      `INSERT INTO carpool_offers (driver_id, origin_geom, dest_geom, destination_type, moda, seats, depart_time, has_spare_helmet)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2,$3),4326), ST_SetSRID(ST_MakePoint($4,$5),4326), $6, $7, $8, $9, $10)
       RETURNING id`,
      [me, o.lng, o.lat, d.lng, d.lat, b.destination_type, b.moda, seats, b.depart_time ?? null,
        b.moda === 'motor' ? b.has_spare_helmet : null],
    );
    return rows[0];
  }

  @Get('/offers')
  async list(@Req() req: any, @Query('moda') moda: string) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT o.id, o.moda, o.seats, o.depart_time, o.has_spare_helmet, o.destination_type,
        ST_Y(o.origin_geom::geometry) AS o_lat, ST_X(o.origin_geom::geometry) AS o_lng,
        ST_Y(o.dest_geom::geometry) AS d_lat, ST_X(o.dest_geom::geometry) AS d_lng,
        u.name AS driver, (u.verification_status = 'verified') AS driver_terverifikasi,
        (u.vehicle_status = 'verified') AS kendaraan_terverifikasi,
        (SELECT COUNT(*)::int FROM carpool_requests r WHERE r.offer_id = o.id AND r.status = 'accepted') AS taken
       FROM carpool_offers o JOIN users u ON u.id = o.driver_id
       WHERE o.status = 'open' AND o.driver_id <> $1
         AND ($2 = '' OR o.moda = $2)
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = o.driver_id) OR (b.blocker_id = o.driver_id AND b.blocked_id = $1))
       ORDER BY o.created_at DESC LIMIT 50`,
      [me, moda ?? ''],
    );
    return rows.map((r: any) => ({ ...r, seats_left: r.seats - r.taken }));
  }

  @Post('/offers/:id/request')
  async request(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    await requireVerified(me);
    const { rows } = await pool.query(`SELECT driver_id, status FROM carpool_offers WHERE id = $1`, [id]);
    if (!rows[0] || rows[0].status !== 'open') throw new ForbiddenException('offer tidak tersedia');
    if (rows[0].driver_id === me) throw new ForbiddenException('tidak bisa request offer sendiri');
    try {
      await pool.query(`INSERT INTO carpool_requests (offer_id, passenger_id) VALUES ($1, $2)`, [id, me]);
    } catch {
      throw new ForbiddenException('sudah request offer ini');
    }
    return { ok: true };
  }

  @Get('/requests/incoming')
  async incoming(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT r.id, r.status, r.offer_id, u.name AS passenger,
              (u.verification_status = 'verified') AS passenger_terverifikasi
       FROM carpool_requests r
       JOIN carpool_offers o ON o.id = r.offer_id
       JOIN users u ON u.id = r.passenger_id
       WHERE o.driver_id = $1 AND r.status = 'pending' ORDER BY r.created_at ASC`,
      [me],
    );
    return rows;
  }

  @Post('/requests/:id/accept')
  async accept(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    await requireVerified(me);
    const { rows } = await pool.query(
      `SELECT r.*, o.driver_id, o.seats, o.has_spare_helmet FROM carpool_requests r
       JOIN carpool_offers o ON o.id = r.offer_id WHERE r.id = $1`,
      [id],
    );
    const r = rows[0];
    if (!r || r.driver_id !== me) throw new ForbiddenException('bukan offer kamu');
    if (r.status !== 'pending') throw new ForbiddenException('request sudah diproses');
    await requireVerified(r.passenger_id);
    const { rows: cnt } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM carpool_requests WHERE offer_id = $1 AND status = 'accepted'`,
      [r.offer_id],
    );
    if (cnt[0].n >= r.seats) throw new ForbiddenException('kursi penuh');
    await pool.query(`UPDATE carpool_requests SET status = 'accepted' WHERE id = $1`, [id]);
    const { rows: s } = await pool.query(
      `INSERT INTO carpool_sessions (driver_id, passenger_id, status, has_spare_helmet)
       VALUES ($1, $2, 'accepted', $3) RETURNING id`,
      [me, r.passenger_id, r.has_spare_helmet],
    );
    return { ok: true, session_id: s[0].id };
  }

  @Post('/requests/:id/decline')
  async decline(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT r.*, o.driver_id FROM carpool_requests r JOIN carpool_offers o ON o.id = r.offer_id WHERE r.id = $1`,
      [id],
    );
    if (!rows[0] || rows[0].driver_id !== me) throw new ForbiddenException('bukan offer kamu');
    await pool.query(`UPDATE carpool_requests SET status = 'declined' WHERE id = $1`, [id]);
    return { ok: true };
  }

  @Get('/sessions/me')
  async mySessions(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT id, driver_id, passenger_id, status FROM carpool_sessions
       WHERE driver_id = $1 OR passenger_id = $1 ORDER BY id DESC LIMIT 20`,
      [me],
    );
    return rows;
  }

  @Patch('/sessions/:id/finish')
  async finish(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    const { rows } = await pool.query(`SELECT * FROM carpool_sessions WHERE id = $1`, [id]);
    if (!rows[0] || rows[0].driver_id !== me) throw new ForbiddenException('hanya driver');
    await pool.query(
      `UPDATE carpool_sessions SET status = 'finished', finished_at = now() WHERE id = $1`, [id],
    );
    return { ok: true };
  }

  @Patch('/sessions/:id/start')
  async start(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    const { rows } = await pool.query(`SELECT * FROM carpool_sessions WHERE id = $1`, [id]);
    if (!rows[0] || rows[0].driver_id !== me) throw new ForbiddenException('hanya driver');
    if (rows[0].status !== 'accepted') throw new ForbiddenException('sesi tidak dalam status accepted');
    await pool.query(
      `UPDATE carpool_sessions SET status = 'ongoing', started_at = now() WHERE id = $1`, [id],
    );
    return { ok: true };
  }

  // Link berbagi ke kontak darurat (tanpa login, kedaluwarsa 12 jam).
  @Post('/sessions/:id/share')
  async share(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    const { rows } = await pool.query(`SELECT * FROM carpool_sessions WHERE id = $1`, [id]);
    if (!rows[0] || (rows[0].driver_id !== me && rows[0].passenger_id !== me))
      throw new ForbiddenException('bukan sesi kamu');
    if (rows[0].status !== 'ongoing') throw new ForbiddenException('hanya sesi aktif');
    const { rows: t } = await pool.query(
      `INSERT INTO share_tokens (session_id) VALUES ($1) RETURNING token, expires_at`, [id],
    );
    return t[0];
  }

  @Post('/sessions/:id/ping')
  async ping(@Req() req: any, @Param('id') id: string, @Body() b: { lat: number; lng: number }) {
    const me = authUserId(req);
    const { rows } = await pool.query(`SELECT * FROM carpool_sessions WHERE id = $1`, [id]);
    if (!rows[0] || (rows[0].driver_id !== me && rows[0].passenger_id !== me))
      throw new ForbiddenException('bukan sesi kamu');
    if (rows[0].status !== 'ongoing') throw new ForbiddenException('hanya sesi aktif');
    if (typeof b?.lat !== 'number' || typeof b?.lng !== 'number')
      throw new ForbiddenException('lat/lng wajib angka');
    await pool.query(
      `INSERT INTO location_pings (session_id, user_id, geom) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3,$4),4326))`,
      [id, me, b.lng, b.lat],
    );
    return { ok: true };
  }
}

@Controller('/share')
export class ShareController {
  @Get('/:token/track')
  async track(@Param('token') token: string) {
    const { rows: t } = await pool.query(
      `SELECT session_id FROM share_tokens WHERE token = $1 AND expires_at > now()`, [token],
    );
    if (!t[0]) throw new ForbiddenException('link tidak valid/kedaluwarsa');
    const { rows } = await pool.query(
      `SELECT ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng, created_at
       FROM location_pings WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [t[0].session_id],
    );
    return rows.reverse();
  }
}
