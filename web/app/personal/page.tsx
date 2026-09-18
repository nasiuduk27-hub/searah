'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Personal() {
  const [mine, setMine] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [cands, setCands] = useState<any[]>([]);
  const [mutual, setMutual] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  function load() {
    api('/personal/interests').then(setMine).catch(() => {});
    api('/personal/candidates').then(setCands).catch(() => setCands([]));
    api('/personal/mutual').then(setMutual).catch(() => {});
  }
  useEffect(load, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const interests = [...mine, ...draft.split(',').map((s) => s.trim()).filter(Boolean)];
    await api('/personal/interests', { method: 'PUT', body: JSON.stringify({ interests }) });
    setDraft('');
    load();
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h1>Kenal Lebih Jauh</h1>
      <p>Hanya untuk yang sudah rutin searah (min 2 sesi, rating baik). Tidak ada swipe ke orang asing.</p>
      <form onSubmit={save} style={{ display: 'flex', gap: 8 }}>
        <input placeholder="Minat, pisahkan koma" value={draft} onChange={(e) => setDraft(e.target.value)} style={{ flex: 1 }} />
        <button type="submit">Simpan</button>
      </form>
      <p>Minat saya: {mine.join(', ') || '-'}</p>
      <h2>Searah & sehobi ({cands.length})</h2>
      {cands.map((c) => (
        <div key={c.id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
          {c.name} · {c.shared} minat sama
          <button style={{ marginLeft: 8 }} onClick={async () => {
            const r = await api(`/personal/interest/${c.id}`, { method: 'POST', body: '{}' });
            setMsg(r.mutual ? `Mutual dengan ${c.name}! Sapa lewat /pesan.` : `Tertarik ke ${c.name} dicatat (rahasia sampai mutual).`);
            load();
          }}>Tertarik</button>
        </div>
      ))}
      <h2>Mutual ({mutual.length})</h2>
      <ul>{mutual.map((m) => <li key={m.id}>{m.name}</li>)}</ul>
      <p>{msg}</p>
    </main>
  );
}
