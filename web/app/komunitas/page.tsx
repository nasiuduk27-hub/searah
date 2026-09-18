'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

// ponytail: polling 5 detik, ganti Socket.io saat realtime benar-benar dibutuhkan.
export default function Komunitas() {
  const [list, setList] = useState<any[]>([]);
  const [active, setActive] = useState('');
  const [msgs, setMsgs] = useState<any[]>([]);
  const [draft, setDraft] = useState('');

  function loadList() {
    api('/communities').then((r) => {
      setList(r);
      if (!active && r[0]) setActive(r[0].id);
    }).catch(() => {});
  }
  useEffect(loadList, []);

  useEffect(() => {
    if (!active) return;
    let stop = false;
    async function poll() {
      try {
        const m = await api(`/communities/${active}/messages`);
        if (!stop) setMsgs(m);
      } catch {}
    }
    poll();
    const t = setInterval(poll, 5000);
    return () => { stop = true; clearInterval(t); };
  }, [active]);

  async function join(id: string) {
    await api(`/communities/${id}/join`, { method: 'POST', body: '{}' });
    loadList();
    setActive(id);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    await api(`/communities/${active}/messages`, { method: 'POST', body: JSON.stringify({ body: draft }) });
    setDraft('');
    setMsgs(await api(`/communities/${active}/messages`));
  }

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <h1>Komunitas</h1>
      {list.map((c) => (
        <div key={c.id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
          <b>{c.name}</b> · {c.moda}
          {c.joined ? <button onClick={() => setActive(c.id)} style={{ marginLeft: 8 }}>Buka</button>
            : <button onClick={() => join(c.id)} style={{ marginLeft: 8 }}>Gabung</button>}
        </div>
      ))}
      {active && (
        <>
          <ul>{msgs.map((m) => <li key={m.id}><b>{m.name}</b>{m.terverifikasi ? ' ✓' : ''}: {m.body}</li>)}</ul>
          <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Tulis pesan…" style={{ flex: 1 }} />
            <button type="submit">Kirim</button>
          </form>
        </>
      )}
    </main>
  );
}
