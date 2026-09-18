'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Rating() {
  const [sessionId, setSessionId] = useState('');
  const [score, setScore] = useState('5');
  const [avg, setAvg] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/ratings/received').then(setAvg).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/ratings', { method: 'POST', body: JSON.stringify({ session_id: sessionId, score: Number(score) }) });
      setMsg('Rating terkirim.');
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Rating Carpool</h1>
      <p>Hanya untuk sesi yang sudah selesai. {avg ? `Rata-rata saya: ${Number(avg.avg ?? 0).toFixed(1)} (${avg.n})` : ''}</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input placeholder="ID sesi" value={sessionId} onChange={(e) => setSessionId(e.target.value)} required />
        <select value={score} onChange={(e) => setScore(e.target.value)}>
          <option value="1">1</option><option value="2">2</option><option value="3">3</option>
          <option value="4">4</option><option value="5">5</option>
        </select>
        <button type="submit">Kirim rating</button>
      </form>
      <p>{msg}</p>
    </main>
  );
}
