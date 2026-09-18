import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { pool } from './db';

// ponytail: rate-limit in-memory, pindah ke Redis (REDIS_URL) kalau trafik naik.
const otpHits = new Map<string, number[]>();
const otpCodes = new Map<string, string>();

function rateLimited(phone: string): boolean {
  const limit = Number(process.env.OTP_RATE_LIMIT_PER_HOUR ?? 5);
  const now = Date.now();
  const arr = (otpHits.get(phone) ?? []).filter((t) => now - t < 3_600_000);
  arr.push(now);
  otpHits.set(phone, arr);
  return arr.length > limit;
}

function sign(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? 'dev_secret_ganti_di_prod', {
    expiresIn: '7d',
  });
}

export function authUserId(req: any): string {
  const h = req.headers?.authorization ?? '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) throw new UnauthorizedException('token wajib');
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET ?? 'dev_secret_ganti_di_prod') as any;
    return p.sub as string;
  } catch {
    throw new UnauthorizedException('token tidak valid');
  }
}

@Controller('/auth')
export class AuthController {
  @Post('/register')
  async register(@Body() b: { phone: string; name: string; gender?: string }) {
    if (!b?.phone || !b?.name) throw new UnauthorizedException('phone dan name wajib');
    const gender = ['perempuan', 'laki-laki', 'lainnya'].includes(b.gender ?? '')
      ? b.gender
      : null;
    const { rows } = await pool.query(
      `INSERT INTO users (phone, name, gender)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, phone, phone_verified, verification_status`,
      [b.phone, b.name, gender],
    );
    return rows[0];
  }

  @Post('/otp/request')
  async requestOtp(@Body() b: { phone: string }) {
    if (!b?.phone) throw new UnauthorizedException('phone wajib');
    if (rateLimited(b.phone)) throw new UnauthorizedException('terlalu sering, coba lagi nanti');
    // MVP: kode dummy, log saja. Ganti OTP_PROVIDER asli di produksi.
    const code = '123456';
    otpCodes.set(b.phone, code);
    if (process.env.NODE_ENV !== 'production') return { sent: true, dev_code: code };
    return { sent: true };
  }

  @Post('/otp/verify')
  async verifyOtp(@Body() b: { phone: string; code: string }) {
    if (otpCodes.get(b.phone) !== b.code) throw new UnauthorizedException('kode salah');
    otpCodes.delete(b.phone);
    const { rows } = await pool.query(`UPDATE users SET phone_verified = TRUE WHERE phone = $1 RETURNING id`, [
      b.phone,
    ]);
    if (!rows[0]) throw new UnauthorizedException('nomor belum terdaftar');
    return { token: sign(rows[0].id) };
  }

  @Get('/me')
  async me(@Req() req: any) {
    const id = authUserId(req);
    const { rows } = await pool.query(
      `SELECT id, phone, phone_verified, name, verification_status, trust_level FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }
}
