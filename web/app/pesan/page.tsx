'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

// ponytail: polling 5 detik seperti chat grup, ganti Socket.io saat perlu.
export default function Pesan() {
  const [peer, setPeer] = useState('');
  const [msgs, setMsgs] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!peer) return;
    let stop = false;
    async function poll() {
      try {
        const m = await api(`/dm/${peer}`);
        if (!stop) { setMsgs(m); setMsg(''); }
      } catch (e: any) {
        if (!stop) setMsg(e.message);
      }
    }
    poll();
    const t = setInterval(poll, 5000);
    return () => { stop = true; clearInterval(t); };
  }, [peer]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await api(`/dm/${peer}`, { method: 'POST', body: JSON.stringify({ body: draft }) });
      setDraft('');
      setMsgs(await api(`/dm/${peer}`));
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h1>Pesan Personal</h1>
      <p>Hanya untuk sesama terverifikasi. Kenalan dulu di grup komunitas.</p>
      <input placeholder="ID pengguna" value={peer} onChange={(e) => setPeer(e.target.value)} style={{ width: '100%' }} />
      <ul>{msgs.map((m) => <li key={m.id}>{m.body}</li>)}</ul>
      {peer && (
        <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Tulis pesan…" style={{ flex: 1 }} />
          <button type="submit">Kirim</button>
        </form>
      )}
      <p>{msg}</p>
    </main>
  );
}
