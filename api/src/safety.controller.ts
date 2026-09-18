import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

const CATS = ['pelecehan', 'penipuan', 'akun_palsu', 'spam', 'lainnya'];

@Controller('/safety')
export class SafetyController {
  @Post('/reports')
  async report(@Req() req: any, @Body() b: { reported_id: string; category: string; detail?: string }) {
    const me = authUserId(req);
    if (!b?.reported_id || b.reported_id === me) throw new ForbiddenException('target invalid');
    if (!CATS.includes(b?.category)) throw new ForbiddenException('kategori invalid');
    const { rows } = await pool.query(
      `INSERT INTO reports (reporter_id, reported_id, category, detail) VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
      [me, b.reported_id, b.category, (b.detail ?? '').slice(0, 1000)],
    );
    return rows[0];
  }

  @Get('/reports/me')
  async myReports(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT id, reported_id, category, status, created_at FROM reports WHERE reporter_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [me],
    );
    return rows;
  }

  @Post('/blocks')
  async block(@Req() req: any, @Body() b: { blocked_id: string }) {
    const me = authUserId(req);
    if (!b?.blocked_id || b.blocked_id === me) throw new ForbiddenException('target invalid');
    await pool.query(
      `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [me, b.blocked_id],
    );
    return { ok: true };
  }

  @Get('/blocks/me')
  async myBlocks(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT u.id, u.name FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = $1`,
      [me],
    );
    return rows;
  }

  @Delete('/blocks/:id')
  async unblock(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    await pool.query(`DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`, [me, id]);
    return { ok: true };
  }

  @Get('/contacts')
  async contacts(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT id, name, phone FROM emergency_contacts WHERE user_id = $1 ORDER BY created_at ASC LIMIT 5`,
      [me],
    );
    return rows;
  }

  @Post('/contacts')
  async addContact(@Req() req: any, @Body() b: { name: string; phone: string }) {
    const me = authUserId(req);
    if (!b?.name || !b?.phone) throw new ForbiddenException('nama dan nomor wajib');
    const { rows } = await pool.query(
      `INSERT INTO emergency_contacts (user_id, name, phone) VALUES ($1, $2, $3) RETURNING id, name, phone`,
      [me, b.name.slice(0, 100), b.phone.slice(0, 20)],
    );
    return rows[0];
  }

  @Delete('/contacts/:id')
  async delContact(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    await pool.query(`DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2`, [id, me]);
    return { ok: true };
  }

  // ponytail: tanpa push otomatis dulu; event tercatat + instruksikan hubungi 110/112.
  @Post('/sos')
  async sos(@Req() req: any, @Body() b: { session_id?: string; lat?: number; lng?: number }) {
    const me = authUserId(req);
    const hasGeo = typeof b?.lat === 'number' && typeof b?.lng === 'number';
    await pool.query(
      `INSERT INTO sos_events (user_id, session_id, geom) VALUES ($1, $2, ${hasGeo ? 'ST_SetSRID(ST_MakePoint($3,$4),4326)' : 'NULL'})`,
      hasGeo ? [me, b.session_id ?? null, b.lng, b.lat] : [me, b.session_id ?? null],
    );
    return { ok: true, call: ['110 (Polisi)', '112 (Darurat)', '118 (Ambulans)'] };
  }
}
