'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Temukan() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [home, setHome] = useState('');
  const [office, setOffice] = useState('');
  const [hasil, setHasil] = useState<any[]>([]);
  const [mode, setMode] = useState('v3');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/routes/me').then(setRoutes).catch(() => {});
  }, []);

  async function cari(e: React.FormEvent) {
    e.preventDefault();
    try {
      const h = routes.find((r) => r.id === home);
      const o = routes.find((r) => r.id === office);
      if (!h || !o) return setMsg('Pilih titik rumah + kantor dulu di /rute');
      const q = new URLSearchParams({
        home_lat: String(h.lat), home_lng: String(h.lng),
        office_lat: String(o.lat), office_lng: String(o.lng),
        moda: h.moda, radius_m: '2000',
      });
      setHasil(await api(`/discover${mode === 'v1' ? '' : `/${mode}`}?${q}`));
      setMsg(mode === 'v3' ? 'Koridor 500m + detour dalam toleransi driver. Titik publik saja.' : mode === 'v2' ? 'Mode koridor: jemputmu dalam 500m rute mereka. Titik publik saja.' : 'Hanya titik publik (area ±300-500m), bukan lokasi presisi.');
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h1>Temukan yang Searah</h1>
      <form onSubmit={cari} style={{ display: 'grid', gap: 12 }}>
        <select value={home} onChange={(e) => setHome(e.target.value)}>
          <option value="">— Rumah saya —</option>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.destination_type} · {r.moda}</option>)}
        </select>
        <select value={office} onChange={(e) => setOffice(e.target.value)}>
          <option value="">— Kantor / transit saya —</option>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.destination_type} · {r.moda}</option>)}
        </select>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="v1">Radius + bearing</option>
          <option value="v2">Koridor 500m</option>
          <option value="v3">Koridor + detour</option>
        </select>
        <button type="submit">Cari (bearing ≤45°)</button>
      </form>
      <p>{msg}</p>
      <ul>
        {hasil.map((h, i) => (
          <li key={i}>Sekitar area ({h.lat.toFixed(3)},{h.lng.toFixed(3)}) · {h.corridor_m != null ? `${h.corridor_m}m dari rute` : `${h.distance_m}m`}{h.detour_min != null ? ` · +${h.detour_min} mnt` : ''} · selisih arah {h.bearing_diff}° {h.verification_status === 'verified' ? '· Terverifikasi ✓' : ''}{h.kantor_terverifikasi ? ' · Kantor ✓' : ''}</li>
        ))}
      </ul>
    </main>
  );
}
