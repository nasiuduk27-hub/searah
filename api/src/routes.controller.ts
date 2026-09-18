import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

const DESTS = ['rumah', 'kantor', 'titik_transit'];
const MODAS = ['mobil', 'motor', 'krl', 'bus', 'jalan_kaki'];

// Offset acak 300-500m untuk titik publik (PRD 9.3.1). Internal tetap presisi di DB.
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

@Controller('/routes')
export class RoutesController {
  @Post()
  async upsert(
    @Req() req: any,
    @Body()
    b: {
      destination_type: string;
      lat: number;
      lng: number;
      moda: string;
      depart_time?: string;
      return_time?: string;
      max_detour_minutes?: number;
    },
  ) {
    const userId = authUserId(req);
    if (!DESTS.includes(b?.destination_type)) throw new ForbiddenException('destination_type invalid');
    if (!MODAS.includes(b?.moda)) throw new ForbiddenException('moda invalid');
    if (typeof b?.lat !== 'number' || typeof b?.lng !== 'number') throw new ForbiddenException('lat/lng wajib angka');
    if (b.lat < -90 || b.lat > 90 || b.lng < -180 || b.lng > 180)
      throw new ForbiddenException('koordinat invalid');
    // ponytail: tanpa cek bbox Jabodetabek dulu, add saat density jadi masalah.
    const pub = fuzz(b.lat, b.lng);
    const { rows } = await pool.query(
      `INSERT INTO trip_points (user_id, destination_type, internal_geom, public_geom, moda, depart_time, return_time, max_detour_minutes)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9, $10)
       RETURNING id, destination_type, moda,
         ST_Y(internal_geom::geometry) AS lat_internal, ST_X(internal_geom::geometry) AS lng_internal,
         ST_Y(public_geom::geometry) AS lat_public, ST_X(public_geom::geometry) AS lng_public`,
      [
        userId, b.destination_type, b.lng, b.lat, pub.lng, pub.lat, b.moda,
        b.depart_time ?? null, b.return_time ?? null, b.max_detour_minutes ?? 10,
      ],
    );
    return rows[0];
  }

  // Titik internal hanya untuk pemilik; orang lain hanya dapat public via /discover (berikutnya).
  @Get('/me')
  async mine(@Req() req: any) {
    const userId = authUserId(req);
    const { rows } = await pool.query(
      `SELECT id, destination_type, moda, depart_time, return_time, max_detour_minutes,
        ST_Y(internal_geom::geometry) AS lat, ST_X(internal_geom::geometry) AS lng
       FROM trip_points WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows;
  }

  @Delete('/:id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = authUserId(req);
    await pool.query(`DELETE FROM trip_points WHERE id = $1 AND user_id = $2`, [id, userId]);
    return { ok: true };
  }
}
