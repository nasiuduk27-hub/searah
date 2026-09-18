import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { randomBytes, createCipheriv } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { pool } from './db';
import { authUserId } from './auth.controller';

function encKey(): Buffer {
  const b64 = process.env.IDENTITY_DOCS_ENCRYPTION_KEY ?? '';
  try {
    const k = Buffer.from(b64, 'base64');
    if (k.length === 32) return k;
  } catch {}
  // ponytail: kunci dev sementara, wajib isi 32-byte base64 di produksi.
  return randomBytes(32);
}

async function saveEncrypted(dataB64: string, userId: string, docType: string): Promise<string> {
  const raw = Buffer.from(dataB64.split(',').pop() ?? '', 'base64');
  if (raw.length === 0 || raw.length > 5 * 1024 * 1024) throw new ForbiddenException('file tidak valid / >5MB');
  const key = encKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(raw), cipher.final(), cipher.getAuthTag()]);
  await mkdir('./uploads', { recursive: true });
  // ponytail: simpan lokal terenkripsi; ganti ke S3-compatible saat produksi (lihat .env.example).
  const storageKey = `${userId}_${docType}_${Date.now()}.enc`;
  await writeFile(`./uploads/${storageKey}`, Buffer.concat([iv, enc]));
  return storageKey;
}

@Controller()
export class VerificationsController {
  @Post('/verifications')
  async upload(@Req() req: any, @Body() b: { doc_type: string; data_base64: string }) {
    const userId = authUserId(req);
    if (!['ktp', 'selfie'].includes(b?.doc_type)) throw new ForbiddenException('doc_type harus ktp/selfie');
    const storageKey = await saveEncrypted(b.data_base64, userId, b.doc_type);
    await pool.query(
      `INSERT INTO verification_documents (user_id, doc_type, storage_key, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (user_id, doc_type) DO UPDATE SET storage_key = EXCLUDED.storage_key, status = 'pending'`,
      [userId, b.doc_type, storageKey],
    );
    await pool.query(`UPDATE users SET verification_status = 'pending' WHERE id = $1`, [userId]);
    return { ok: true, status: 'pending' };
  }

  @Get('/verifications/me')
  async mine(@Req() req: any) {
    const userId = authUserId(req);
    const { rows } = await pool.query(
      `SELECT u.verification_status,
              (u.verification_status = 'verified') AS badge_terverifikasi
       FROM users u WHERE u.id = $1`,
      [userId],
    );
    return rows[0] ?? { verification_status: 'unverified', badge_terverifikasi: false };
  }

  // Review manual admin (Tingkat 1). Header: x-admin-token: $ADMIN_TOKEN
  @Patch('/admin/verifications/:id')
  async review(@Req() req: any, @Param('id') id: string, @Body() b: { status: string }) {
    if (req.headers?.['x-admin-token'] !== (process.env.ADMIN_TOKEN ?? 'dev_admin_token'))
      throw new ForbiddenException('admin saja');
    if (!['approved', 'rejected'].includes(b?.status)) throw new ForbiddenException('status invalid');
    await pool.query(`UPDATE verification_documents SET status = $1 WHERE id = $2`, [b.status, id]);
    const { rows } = await pool.query(
      `SELECT user_id FROM verification_documents WHERE id = $1`, [id],
    );
    const userId = rows[0]?.user_id;
    if (userId) {
      const { rows: docs } = await pool.query(
        `SELECT status FROM verification_documents WHERE user_id = $1`, [userId],
      );
      const next =
        docs.length >= 2 && docs.every((d: any) => d.status === 'approved')
          ? 'verified'
          : b.status === 'rejected'
            ? 'rejected'
            : 'pending';
      await pool.query(`UPDATE users SET verification_status = $1 WHERE id = $2`, [next, userId]);
      return { ok: true, verification_status: next };
    }
    return { ok: true };
  }
}
