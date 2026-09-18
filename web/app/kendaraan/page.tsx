'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

function toB64(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export default function Kendaraan() {
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState('');

  function load() {
    api('/vehicles/me').then((v) => setStatus(v.vehicle_status)).catch(() => {});
  }
  useEffect(load, []);

  async function upload(doc_type: string, f: File | undefined) {
    if (!f) return;
    try {
      const data_base64 = await toB64(f);
      await api('/vehicles', { method: 'POST', body: JSON.stringify({ doc_type, data_base64 }) });
      setMsg(`${doc_type} terkirim, menunggu review manual.`);
      load();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Verifikasi Kendaraan</h1>
      <p>Status: {status || '-'}. STNK + foto kendaraan direview manual, hanya badge yang tampil publik.</p>
      <label>STNK <input type="file" accept="image/*" capture="environment" onChange={(e) => upload('stnk', e.target.files?.[0])} /></label>
      <br /><br />
      <label>Foto kendaraan <input type="file" accept="image/*" capture="environment" onChange={(e) => upload('foto_kendaraan', e.target.files?.[0])} /></label>
      <br /><br />
      <label>Plat nomor <input type="file" accept="image/*" capture="environment" onChange={(e) => upload('plat', e.target.files?.[0])} /></label>
      <p>{msg}</p>
    </main>
  );
}
