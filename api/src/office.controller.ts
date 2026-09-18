import { Body, Controller, ForbiddenException, Get, Post, Query, Req } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { pool } from './db';
import { authUserId } from './auth.controller';

// Email gratis yang ditolak (bukan email kantor).
const FREE = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.id', 'outlook.com', 'hotmail.com',
  'live.com', 'icloud.com', 'me.com', 'protonmail.com', 'proton.me', 'zoho.com', 'aol.com',
]);

@Controller('/office')
export class OfficeController {
  @Post('/request')
  async request(@Req() req: any, @Body() b: { email: string }) {
    const me = authUserId(req);
    const email = (b?.email ?? '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ForbiddenException('email invalid');
    const domain = email.split('@')[1];
    if (FREE.has(domain)) throw new ForbiddenException('gunakan email kantor, bukan email gratis');
    const token = randomBytes(24).toString('hex');
    await pool.query(
      `UPDATE users SET office_email = $1, office_email_verified = FALSE,
        office_email_token = $2, office_email_token_expires = now() + interval '24 hours' WHERE id = $3`,
      [email, token, me],
    );
    // ponytail: tanpa provider email dulu; di produksi kirim link via Resend/SMTP di sini.
    if (process.env.NODE_ENV !== 'production') return { sent: true, dev_token: token };
    return { sent: true };
  }

  @Get('/verify')
  async verify(@Query('token') token: string) {
    if (!token) throw new ForbiddenException('token wajib');
    const { rows } = await pool.query(
      `UPDATE users SET office_email_verified = TRUE, office_email_token = NULL,
        office_email_token_expires = NULL
       WHERE office_email_token = $1 AND office_email_token_expires > now()
       RETURNING id, office_email`,
      [token],
    );
    if (!rows[0]) throw new ForbiddenException('token tidak valid/kedaluwarsa');
    return { ok: true, email: rows[0].office_email };
  }

  @Get('/me')
  async me(@Req() req: any) {
    const id = authUserId(req);
    const { rows } = await pool.query(
      `SELECT office_email, office_email_verified FROM users WHERE id = $1`, [id],
    );
    return rows[0] ?? { office_email: null, office_email_verified: false };
  }
}
