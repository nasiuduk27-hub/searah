'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Carpool() {
  const [form, setForm] = useState({ origin_lat: '', origin_lng: '', dest_lat: '', dest_lng: '', moda: 'mobil', seats: '3', has_spare_helmet: false });
  const [offers, setOffers] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  function load() {
    api('/carpool/offers').then(setOffers).catch(() => {});
    api('/carpool/requests/incoming').then(setIncoming).catch(() => {});
    api('/carpool/sessions/me').then(setSessions).catch(() => {});
  }
  useEffect(load, []);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/carpool/offers', {
        method: 'POST',
        body: JSON.stringify({
          origin_lat: Number(form.origin_lat), origin_lng: Number(form.origin_lng),
          dest_lat: Number(form.dest_lat), dest_lng: Number(form.dest_lng),
          destination_type: 'kantor', moda: form.moda, seats: Number(form.seats),
          has_spare_helmet: form.moda === 'motor' ? form.has_spare_helmet : undefined,
        }),
      });
      setMsg('Offer terbit. Wajib motor tanpa helm: penumpang bawa helm sendiri (SNI).');
      load();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <h1>Carpool</h1>
      <p>SEARAH bukan ojek online — hanya nebeng searah terjadwal, split bensin/tol via chat pribadi.</p>
      <h2>Tawarkan kursi</h2>
      <form onSubmit={post} style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Asal lat" value={form.origin_lat} onChange={(e) => setForm({ ...form, origin_lat: e.target.value })} required />
          <input placeholder="Asal lng" value={form.origin_lng} onChange={(e) => setForm({ ...form, origin_lng: e.target.value })} required />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Tujuan lat" value={form.dest_lat} onChange={(e) => setForm({ ...form, dest_lat: e.target.value })} required />
          <input placeholder="Tujuan lng" value={form.dest_lng} onChange={(e) => setForm({ ...form, dest_lng: e.target.value })} required />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={form.moda} onChange={(e) => setForm({ ...form, moda: e.target.value })}>
            <option value="mobil">Mobil</option><option value="motor">Motor</option>
          </select>
          <input placeholder="Kursi" type="number" min={1} max={7} value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} />
        </div>
        {form.moda === 'motor' && (
          <label><input type="checkbox" checked={form.has_spare_helmet} onChange={(e) => setForm({ ...form, has_spare_helmet: e.target.checked })} /> Punya helm cadangan untuk penumpang</label>
        )}
        <button type="submit">Terbitkan</button>
      </form>
      <h2>Tawaran searah</h2>
      {offers.map((o) => (
        <div key={o.id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
          <b>{o.driver}</b>{o.driver_terverifikasi ? ' ✓' : ''}{o.kendaraan_terverifikasi ? ' · Kendaraan ✓' : ''} · {o.moda} · sisa {o.seats_left} kursi
          {o.moda === 'motor' && <span> · {o.has_spare_helmet ? 'Helm cadangan: Ya' : 'Penumpang wajib bawa helm sendiri'}</span>}
          <button style={{ marginLeft: 8 }} onClick={async () => { try { await api(`/carpool/offers/${o.id}/request`, { method: 'POST', body: '{}' }); setMsg('Request terkirim.'); } catch (e: any) { setMsg(e.message); } }}>Nebeng</button>
        </div>
      ))}
      <h2>Request masuk (driver)</h2>
      {incoming.map((r) => (
        <div key={r.id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
          {r.passenger}{r.passenger_terverifikasi ? ' ✓' : ''}
          <button style={{ marginLeft: 8 }} onClick={async () => { await api(`/carpool/requests/${r.id}/accept`, { method: 'POST', body: '{}' }); load(); }}>Terima</button>
          <button style={{ marginLeft: 4 }} onClick={async () => { await api(`/carpool/requests/${r.id}/decline`, { method: 'POST', body: '{}' }); load(); }}>Tolak</button>
        </div>
      ))}
      <h2>Sesi saya</h2>
      {sessions.map((s) => (
        <div key={s.id}>{s.id.slice(0, 8)} · {s.status}
          {s.status !== 'finished' && <button style={{ marginLeft: 8 }} onClick={async () => { await api(`/carpool/sessions/${s.id}/finish`, { method: 'PATCH' }); load(); }}>Selesai</button>}
        </div>
      ))}
      <p>{msg}</p>
    </main>
  );
}
