'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Streak() {
  const [s, setS] = useState<any>(null);

  useEffect(() => {
    api('/gamifikasi/me').then(setS).catch(() => {});
  }, []);

  if (!s) return <main style={{ padding: 24 }}>Memuat…</main>;
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Streak Saya</h1>
      <p style={{ fontSize: 40 }}>{s.streak_days} hari</p>
      <p>{s.active_days} hari aktif · {s.finished_sessions} sesi carpool selesai</p>
      <h2>Badge</h2>
      <ul>{(s.badges ?? []).map((b: string) => <li key={b}>{b}</li>)}</ul>
      {(!s.badges || s.badges.length === 0) && <p>Belum ada badge. Ngobrol di komunitas tiap hari untuk mulai streak.</p>}
    </main>
  );
}
