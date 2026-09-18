import { Body, Controller, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

// ponytail: rate-limit chat akun baru in-memory (20/jam). Pindah ke Redis saat perlu.
const chatHits = new Map<string, number[]>();

function chatLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (chatHits.get(userId) ?? []).filter((t) => now - t < 3_600_000);
  arr.push(now);
  chatHits.set(userId, arr);
  return arr.length > 20;
}

async function isMember(communityId: string, userId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2`,
    [communityId, userId],
  );
  return !!rows[0];
}

@Controller('/communities')
export class CommunitiesController {
  @Get()
  async list(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT c.*, EXISTS(SELECT 1 FROM community_members m WHERE m.community_id = c.id AND m.user_id = $1) AS joined
       FROM communities c ORDER BY c.name ASC`,
      [me],
    );
    return rows;
  }

  @Post('/:id/join')
  async join(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    await pool.query(
      `INSERT INTO community_members (community_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, me],
    );
    return { ok: true };
  }

  @Get('/:id/messages')
  async messages(@Req() req: any, @Param('id') id: string) {
    const me = authUserId(req);
    if (!(await isMember(id, me))) throw new ForbiddenException('gabung dulu');
    // Sembunyikan pesan dari user yang saling block.
    const { rows } = await pool.query(
      `SELECT m.id, m.body, m.created_at, u.name,
              (u.verification_status = 'verified') AS terverifikasi
       FROM community_messages m JOIN users u ON u.id = m.user_id
       WHERE m.community_id = $1
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $2 AND b.blocked_id = m.user_id) OR (b.blocker_id = m.user_id AND b.blocked_id = $2))
       ORDER BY m.created_at DESC LIMIT 50`,
      [id, me],
    );
    return rows.reverse();
  }

  @Post('/:id/messages')
  async send(@Req() req: any, @Param('id') id: string, @Body() b: { body: string }) {
    const me = authUserId(req);
    if (!(await isMember(id, me))) throw new ForbiddenException('gabung dulu');
    const body = (b?.body ?? '').trim();
    if (body.length === 0 || body.length > 1000) throw new ForbiddenException('pesan 1-1000 karakter');
    if (chatLimited(me)) throw new ForbiddenException('terlalu sering, coba lagi nanti');
    const { rows } = await pool.query(
      `INSERT INTO community_messages (community_id, user_id, body) VALUES ($1, $2, $3)
       RETURNING id, body, created_at`,
      [id, me, body],
    );
    return rows[0];
  }
}
