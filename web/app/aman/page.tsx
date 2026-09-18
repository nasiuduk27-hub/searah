'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Aman() {
  const [reportedId, setReportedId] = useState('');
  const [category, setCategory] = useState('spam');
  const [blocks, setBlocks] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  function load() {
    api('/safety/blocks/me').then(setBlocks).catch(() => {});
  }
  useEffect(load, []);

  async function lapor(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/safety/reports', { method: 'POST', body: JSON.stringify({ reported_id: reportedId, category }) });
      setMsg('Laporan terkirim ke tim Trust & Safety.');
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  async function blokir(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/safety/blocks', { method: 'POST', body: JSON.stringify({ blocked_id: reportedId }) });
      setMsg('Diblokir. Pesan dan hasil discover dari dia disembunyikan.');
      load();
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Lapor & Blokir</h1>
      <form onSubmit={lapor} style={{ display: 'grid', gap: 12 }}>
        <input placeholder="ID pengguna (dari profil/komunitas)" value={reportedId} onChange={(e) => setReportedId(e.target.value)} required />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="pelecehan">Pelecehan</option>
          <option value="penipuan">Penipuan</option>
          <option value="akun_palsu">Akun palsu</option>
          <option value="spam">Spam</option>
          <option value="lainnya">Lainnya</option>
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit">Lapor</button>
          <button type="button" onClick={blokir}>Blokir</button>
        </div>
      </form>
      <p>{msg}</p>
      <ul>{blocks.map((b) => <li key={b.id}>{b.name} ({b.id.slice(0, 8)})</li>)}</ul>
    </main>
  );
}
