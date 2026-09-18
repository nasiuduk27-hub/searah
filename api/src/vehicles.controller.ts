import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';
import { saveEncrypted } from './verifications.controller';

const DOCS = ['stnk', 'foto_kendaraan', 'plat'];

@Controller()
export class VehiclesController {
  @Post('/vehicles')
  async upload(@Req() req: any, @Body() b: { doc_type: string; data_base64: string }) {
    const userId = authUserId(req);
    if (!DOCS.includes(b?.doc_type)) throw new ForbiddenException('doc_type harus stnk/foto_kendaraan/plat');
    const storageKey = await saveEncrypted(b.data_base64, userId, `kendaraan_${b.doc_type}`);
    await pool.query(
      `INSERT INTO vehicle_documents (user_id, doc_type, storage_key, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (user_id, doc_type) DO UPDATE SET storage_key = EXCLUDED.storage_key, status = 'pending'`,
      [userId, b.doc_type, storageKey],
    );
    await pool.query(`UPDATE users SET vehicle_status = 'pending' WHERE id = $1`, [userId]);
    return { ok: true, status: 'pending' };
  }

  @Get('/vehicles/me')
  async mine(@Req() req: any) {
    const userId = authUserId(req);
    const { rows } = await pool.query(
      `SELECT vehicle_status, (vehicle_status = 'verified') AS badge FROM users WHERE id = $1`,
      [userId],
    );
    return rows[0] ?? { vehicle_status: 'unverified', badge: false };
  }

  @Patch('/admin/vehicles/:id')
  async review(@Req() req: any, @Param('id') id: string, @Body() b: { status: string }) {
    if (req.headers?.['x-admin-token'] !== (process.env.ADMIN_TOKEN ?? 'dev_admin_token'))
      throw new ForbiddenException('admin saja');
    if (!['approved', 'rejected'].includes(b?.status)) throw new ForbiddenException('status invalid');
    await pool.query(`UPDATE vehicle_documents SET status = $1 WHERE id = $2`, [b.status, id]);
    const { rows } = await pool.query(`SELECT user_id FROM vehicle_documents WHERE id = $1`, [id]);
    const userId = rows[0]?.user_id;
    if (userId) {
      const { rows: docs } = await pool.query(
        `SELECT status FROM vehicle_documents WHERE user_id = $1 AND doc_type IN ('stnk','foto_kendaraan')`,
        [userId],
      );
      const next =
        docs.length >= 2 && docs.every((d: any) => d.status === 'approved')
          ? 'verified'
          : b.status === 'rejected'
            ? 'rejected'
            : 'pending';
      await pool.query(`UPDATE users SET vehicle_status = $1 WHERE id = $2`, [next, userId]);
      return { ok: true, vehicle_status: next };
    }
    return { ok: true };
  }
}
