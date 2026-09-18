import { Body, Controller, ForbiddenException, Get, Put, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

@Controller('/schedule')
export class ScheduleController {
  @Get('/me')
  async mine(@Req() req: any) {
    const me = authUserId(req);
    const { rows } = await pool.query(
      `SELECT day_of_week, depart_time, return_time FROM work_schedules WHERE user_id = $1 ORDER BY day_of_week`,
      [me],
    );
    return rows;
  }

  @Put()
  async save(@Req() req: any, @Body() b: { days: { day: number; depart: string; ret: string }[] }) {
    const me = authUserId(req);
    const days = (b?.days ?? []).filter(
      (d) => d.day >= 0 && d.day <= 6 && /^\d{2}:\d{2}(:\d{2})?$/.test(d.depart ?? '') && /^\d{2}:\d{2}(:\d{2})?$/.test(d.ret ?? ''),
    );
    if (days.length > 7) throw new ForbiddenException('maks 7 hari');
    await pool.query(`DELETE FROM work_schedules WHERE user_id = $1`, [me]);
    for (const d of days)
      await pool.query(`INSERT INTO work_schedules VALUES ($1, $2, $3, $4)`, [me, d.day, d.depart, d.ret]);
    return { ok: true, days: days.length };
  }
}
