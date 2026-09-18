'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Weekend() {
  const [comms, setComms] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [form, setForm] = useState({ community_id: '', title: '', area_label: '', activity_time: '', max_people: '4' });
  const [msg, setMsg] = useState('');

  function load() {
    api('/communities').then((r) => {
      const j = r.filter((c: any) => c.joined);
      setComms(j);
      if (!form.community_id && j[0]) setForm((f) => ({ ...f, community_id: j[0].id }));
    }).catch(() => {});
    api('/weekend').then(setList).catch(() => {});
    api('/weekend/requests/incoming').then(setIncoming).catch(() => {});
  }
  useEffect(load, []);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/weekend', { method: 'POST', body: JSON.stringify({ ...form, max_people: Number(form.max_people), activity_time: new Date(form.activity_time).toISOString() }) });
      setMsg('Aktivitas terbit untuk sekomunitasmu.');
      load();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <h1>Weekend Bareng</h1>
      <p>Santai non-darurat saja (bukan RS). Hanya sekomunitas commuting yang saling kenal. Titik kumpul detail via DM.</p>
      <h2>Buat ajakan</h2>
      <form onSubmit={post} style={{ display: 'grid', gap: 8 }}>
        <select value={form.community_id} onChange={(e) => setForm({ ...form, community_id: e.target.value })}>
          {comms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input placeholder="cth: Ngopi di Blok M" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Area, cth: Blok M" value={form.area_label} onChange={(e) => setForm({ ...form, area_label: e.target.value })} required />
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="datetime-local" value={form.activity_time} onChange={(e) => setForm({ ...form, activity_time: e.target.value })} required />
          <input type="number" min={2} max={20} value={form.max_people} onChange={(e) => setForm({ ...form, max_people: e.target.value })} />
        </div>
        <button type="submit">Terbitkan</button>
      </form>
      <h2>Ajakan sekomunitas</h2>
      {list.map((a) => (
        <div key={a.id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
          <b>{a.title}</b> · {a.area_label} · {new Date(a.activity_time).toLocaleString('id-ID')} · {a.joined}/{a.max_people} · host {a.host}
          <button style={{ marginLeft: 8 }} onClick={async () => { try { await api(`/weekend/${a.id}/request`, { method: 'POST', body: '{}' }); setMsg('Request terkirim.'); } catch (e: any) { setMsg(e.message); } }}>Ikut</button>
        </div>
      ))}
      <h2>Request masuk</h2>
      {incoming.map((r: any, i: number) => (
        <div key={i} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
          {r.name}
          <button style={{ marginLeft: 8 }} onClick={async () => { await api('/weekend/participants/accept', { method: 'POST', body: JSON.stringify({ activity_id: r.activity_id, user_id: r.user_id }) }); load(); }}>Terima</button>
          <button style={{ marginLeft: 4 }} onClick={async () => { await api('/weekend/participants/decline', { method: 'POST', body: JSON.stringify({ activity_id: r.activity_id, user_id: r.user_id }) }); load(); }}>Tolak</button>
        </div>
      ))}
      <p>{msg}</p>
    </main>
  );
}
