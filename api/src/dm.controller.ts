import { Body, Controller, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

// ponytail: rate-limit in-memory, pindah ke Redis saat perlu.
const dmHits = new Map<string, number[]>();

function dmLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (dmHits.get(userId) ?? []).filter((t) => now - t < 3_600_000);
  arr.push(now);
  dmHits.set(userId, arr);
  return arr.length > 20;
}

async function gate(me: string, peer: string): Promise<void> {
  if (me === peer) throw new ForbiddenException('target invalid');
  const { rows } = await pool.query(`SELECT id, verification_status FROM users WHERE id = ANY($1)`, [[me, peer]]);
  if (rows.length < 2) throw new ForbiddenException('pengguna tidak ditemukan');
  // Grup dulu, personal kemudian: keduanya wajib terverifikasi Tingkat 1.
  if (!rows.every((r: any) => r.verification_status === 'verified'))
    throw new ForbiddenException('chat personal hanya untuk yang sudah terverifikasi');
  const { rows: blocked } = await pool.query(
    `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
    [me, peer],
  );
  if (blocked[0]) throw new ForbiddenException('tidak dapat chat (block)');
}

@Controller('/dm')
export class DmController {
  @Get('/:userId')
  async history(@Req() req: any, @Param('userId') peer: string) {
    const me = authUserId(req);
    await gate(me, peer);
    const { rows } = await pool.query(
      `SELECT id, sender_id, body, created_at FROM direct_messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at DESC LIMIT 50`,
      [me, peer],
    );
    return rows.reverse();
  }

  @Post('/:userId')
  async send(@Req() req: any, @Param('userId') peer: string, @Body() b: { body: string }) {
    const me = authUserId(req);
    await gate(me, peer);
    const body = (b?.body ?? '').trim();
    if (body.length === 0 || body.length > 1000) throw new ForbiddenException('pesan 1-1000 karakter');
    if (dmLimited(me)) throw new ForbiddenException('terlalu sering, coba lagi nanti');
    const { rows } = await pool.query(
      `INSERT INTO direct_messages (sender_id, receiver_id, body) VALUES ($1, $2, $3) RETURNING id, body, created_at`,
      [me, peer, body],
    );
    return rows[0];
  }
}
