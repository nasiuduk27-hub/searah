import { Controller, ForbiddenException, Get, Query, Req } from '@nestjs/common';
import { pool } from './db';
import { authUserId } from './auth.controller';

function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// ponytail: v1 hanya bearing + radius titik publik. H3/detour menyusul (PRD 5.1.1).
@Controller('/discover')
export class DiscoverController {
  @Get()
  async discover(
    @Req() req: any,
    @Query('home_lat') home_lat: string,
    @Query('home_lng') home_lng: string,
    @Query('office_lat') office_lat: string,
    @Query('office_lng') office_lng: string,
    @Query('moda') moda: string,
    @Query('radius_m') radius_m: string,
  ) {
    const me = authUserId(req);
    const hLat = Number(home_lat), hLng = Number(home_lng);
    const oLat = Number(office_lat), oLng = Number(office_lng);
    const radius = Math.min(Number(radius_m ?? 1000) || 1000, 5000);
    if ([hLat, hLng, oLat, oLng].some((v) => !isFinite(v))) throw new ForbiddenException('koordinat rute saya wajib');
    const myBearing = bearing(hLat, hLng, oLat, oLng);

    // Hanya public_geom orang lain, tidak pernah internal. Kecualikan yang saling block.
    const { rows } = await pool.query(
      `SELECT t.user_id, t.destination_type, t.moda,
        ST_Y(t.public_geom::geometry) AS lat, ST_X(t.public_geom::geometry) AS lng,
        ST_Distance(t.public_geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_m,
        u.verification_status, u.office_email_verified AS kantor_terverifikasi
       FROM trip_points t
       JOIN users u ON u.id = t.user_id
       WHERE t.user_id <> $3
         AND ($4 = '' OR t.moda = $4)
         AND ST_DWithin(t.public_geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $5)
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $3 AND b.blocked_id = t.user_id) OR (b.blocker_id = t.user_id AND b.blocked_id = $3))
       ORDER BY distance_m ASC LIMIT 50`,
      [hLng, hLat, me, moda ?? '', radius],
    );

    return rows
      .map((r: any) => {
        const b = bearing(hLat, hLng, Number(r.lat), Number(r.lng));
        let diff = Math.abs(b - myBearing) % 360;
        if (diff > 180) diff = 360 - diff;
        return { ...r, lat: Number(r.lat), lng: Number(r.lng), distance_m: Math.round(Number(r.distance_m)), bearing_diff: Math.round(diff) };
      })
      .filter((r: any) => r.bearing_diff <= 45);
  }

  // v2 koridor (PRD 5.1.1 step 2): titik jemput saya harus jatuh dalam buffer 500m
  // di sekitar garis kantor→rumah kandidat. Hitung di DB dari internal_geom,
  // yang dikembalikan hanya public_geom. Pre-filter radius dulu (murah, pakai index).
  @Get('/v2')
  async discoverV2(
    @Req() req: any,
    @Query('home_lat') home_lat: string,
    @Query('home_lng') home_lng: string,
    @Query('office_lat') office_lat: string,
    @Query('office_lng') office_lng: string,
    @Query('moda') moda: string,
    @Query('radius_m') radius_m: string,
  ) {
    const me = authUserId(req);
    const hLat = Number(home_lat), hLng = Number(home_lng);
    const oLat = Number(office_lat), oLng = Number(office_lng);
    const radius = Math.min(Number(radius_m ?? 2000) || 2000, 5000);
    if ([hLat, hLng, oLat, oLng].some((v) => !isFinite(v))) throw new ForbiddenException('koordinat rute saya wajib');
    const myBearing = bearing(hLat, hLng, oLat, oLng);

    const { rows } = await pool.query(
      `WITH pairs AS (
         SELECT h.user_id, h.moda, h.public_geom AS home_pub, o.public_geom AS off_pub,
           ST_MakeLine(o.internal_geom::geometry, h.internal_geom::geometry)::geography AS line,
           degrees(ST_Azimuth(o.internal_geom::geometry, h.internal_geom::geometry)) AS cbearing
         FROM trip_points h JOIN trip_points o ON o.user_id = h.user_id
         WHERE h.destination_type = 'rumah' AND o.destination_type IN ('kantor','titik_transit')
           AND h.user_id <> $3 AND ($4 = '' OR h.moda = $4)
           AND ST_DWithin(h.internal_geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $5)
       )
       SELECT p.user_id, p.moda,
         ST_Y(p.home_pub::geometry) AS lat, ST_X(p.home_pub::geometry) AS lng,
         ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, p.line) AS corridor_m,
         p.cbearing, u.verification_status, u.office_email_verified AS kantor_terverifikasi
       FROM pairs p JOIN users u ON u.id = p.user_id
       WHERE ST_Within(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, ST_Buffer(p.line, 500))
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $3 AND b.blocked_id = p.user_id) OR (b.blocker_id = p.user_id AND b.blocked_id = $3))
       ORDER BY corridor_m ASC LIMIT 50`,
      [hLng, hLat, me, moda ?? '', radius],
    );

    return rows
      .map((r: any) => {
        let diff = Math.abs(Number(r.cbearing) - myBearing) % 360;
        if (diff > 180) diff = 360 - diff;
        const { cbearing, ...rest } = r;
        return { ...rest, lat: Number(r.lat), lng: Number(r.lng), corridor_m: Math.round(Number(r.corridor_m)), bearing_diff: Math.round(diff) };
      })
      .filter((r: any) => r.bearing_diff <= 45);
  }

  // v3 = v2 + estimasi detour murah di PostGIS (PRD 5.1.1 step 4 versi gratis):
  // detour = D(kantor→jemput) + D(jemput→rumah) − D(kantor→rumah), difilter batas
  // toleransi driver (max_detour_minutes). Asumsi 333 m/menit (±20 km/jam kota).
  // ponytail: heuristik jarak lurus; ganti Directions API bila kunci+budget siap.
  @Get('/v3')
  async discoverV3(
    @Req() req: any,
    @Query('home_lat') home_lat: string,
    @Query('home_lng') home_lng: string,
    @Query('office_lat') office_lat: string,
    @Query('office_lng') office_lng: string,
    @Query('moda') moda: string,
    @Query('radius_m') radius_m: string,
  ) {
    const me = authUserId(req);
    const hLat = Number(home_lat), hLng = Number(home_lng);
    const oLat = Number(office_lat), oLng = Number(office_lng);
    const radius = Math.min(Number(radius_m ?? 2000) || 2000, 5000);
    if ([hLat, hLng, oLat, oLng].some((v) => !isFinite(v))) throw new ForbiddenException('koordinat rute saya wajib');
    const myBearing = bearing(hLat, hLng, oLat, oLng);

    const { rows } = await pool.query(
      `WITH pairs AS (
         SELECT h.user_id, h.moda, h.max_detour_minutes, h.public_geom AS home_pub,
           ST_MakeLine(o.internal_geom::geometry, h.internal_geom::geometry)::geography AS line,
           degrees(ST_Azimuth(o.internal_geom::geometry, h.internal_geom::geometry)) AS cbearing,
           ST_Distance(o.internal_geom, h.internal_geom) AS direct_m,
           ST_Distance(o.internal_geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)
             + ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, h.internal_geom) AS via_m
         FROM trip_points h JOIN trip_points o ON o.user_id = h.user_id
         WHERE h.destination_type = 'rumah' AND o.destination_type IN ('kantor','titik_transit')
           AND h.user_id <> $3 AND ($4 = '' OR h.moda = $4)
           AND ST_DWithin(h.internal_geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $5)
       )
       SELECT p.user_id, p.moda,
         ST_Y(p.home_pub::geometry) AS lat, ST_X(p.home_pub::geometry) AS lng,
         ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, p.line) AS corridor_m,
         (p.via_m - p.direct_m) / 333 AS detour_min,
         p.cbearing, u.verification_status, u.office_email_verified AS kantor_terverifikasi
       FROM pairs p JOIN users u ON u.id = p.user_id
       WHERE ST_Within(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, ST_Buffer(p.line, 500))
         AND (p.via_m - p.direct_m) / 333 <= p.max_detour_minutes
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $3 AND b.blocked_id = p.user_id) OR (b.blocker_id = p.user_id AND b.blocked_id = $3))
       ORDER BY detour_min ASC LIMIT 50`,
      [hLng, hLat, me, moda ?? '', radius],
    );

    return rows
      .map((r: any) => {
        let diff = Math.abs(Number(r.cbearing) - myBearing) % 360;
        if (diff > 180) diff = 360 - diff;
        const { cbearing, ...rest } = r;
        return { ...rest, lat: Number(r.lat), lng: Number(r.lng), corridor_m: Math.round(Number(r.corridor_m)), detour_min: Math.round(Number(r.detour_min) * 10) / 10, bearing_diff: Math.round(diff) };
      })
      .filter((r: any) => r.bearing_diff <= 45);
  }
}
