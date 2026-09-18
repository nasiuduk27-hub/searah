'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Rute() {
  const [form, setForm] = useState({ destination_type: 'rumah', lat: '', lng: '', moda: 'krl' });
  const [list, setList] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  function load() {
    api('/routes/me').then(setList).catch(() => {});
  }
  useEffect(load, []);

  function gps() {
    navigator.geolocation?.getCurrentPosition(
      (p) => setForm((f) => ({ ...f, lat: String(p.coords.latitude), lng: String(p.coords.longitude) })),
      () => setMsg('GPS gagal, isi manual'),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/routes', {
        method: 'POST',
        body: JSON.stringify({ ...form, lat: Number(form.lat), lng: Number(form.lng) }),
      });
      setMsg('Tersimpan. Titik publik dikaburkan 300-500m.');
      load();
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h1>Setup Rute</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <select value={form.destination_type} onChange={(e) => setForm({ ...form, destination_type: e.target.value })}>
          <option value="rumah">Rumah</option>
          <option value="kantor">Kantor</option>
          <option value="titik_transit">Titik transit (stasiun/halte)</option>
        </select>
        <select value={form.moda} onChange={(e) => setForm({ ...form, moda: e.target.value })}>
          <option value="krl">KRL</option>
          <option value="bus">Bus</option>
          <option value="mobil">Mobil</option>
          <option value="motor">Motor</option>
          <option value="jalan_kaki">Jalan kaki</option>
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Lat" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} required />
          <input placeholder="Lng" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} required />
          <button type="button" onClick={gps}>GPS</button>
        </div>
        <button type="submit">Simpan</button>
      </form>
      <p>{msg}</p>
      <ul>
        {list.map((r) => (
          <li key={r.id}>{r.destination_type} · {r.moda} · {r.lat},{r.lng}</li>
        ))}
      </ul>
    </main>
  );
}
