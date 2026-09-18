import { Controller, Get, Param, Query } from '@nestjs/common';
import { pool } from './db';

// Jadwal statis pelengkap (tanpa login). Update manual dari GAPEKA/jadwal resmi.
@Controller('/transit')
export class TransitController {
  @Get('/stops')
  async stops(@Query('mode') mode: string) {
    const { rows } = await pool.query(
      `SELECT code, name, mode, corridor FROM transit_stops WHERE ($1 = '' OR mode = $1) ORDER BY name`,
      [mode ?? ''],
    );
    return rows;
  }

  @Get('/stops/:code/next')
  async next(@Param('code') code: string, @Query('limit') limit: string) {
    const n = Math.min(Number(limit ?? 5) || 5, 20);
    const now = new Date();
    const day = now.getDay();
    const dayType = day === 0 || day === 6 ? 'weekend' : 'weekday';
    const { rows } = await pool.query(
      `SELECT d.depart_time FROM transit_departures d JOIN transit_stops s ON s.id = d.stop_id
       WHERE s.code = $1 AND d.day_type = $2 AND d.depart_time >= $3::time
       ORDER BY d.depart_time ASC LIMIT ${n}`,
      [code, dayType, now.toTimeString().slice(0, 8)],
    );
    return { code, day_type: dayType, next: rows.map((r: any) => r.depart_time) };
  }
}
