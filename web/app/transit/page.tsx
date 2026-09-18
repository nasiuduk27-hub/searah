'use client';
import { useEffect, useState } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Transit() {
  const [stops, setStops] = useState<any[]>([]);
  const [next, setNext] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch(`${BASE}/transit/stops`).then((r) => r.json()).then(setStops).catch(() => {});
  }, []);

  async function show(code: string) {
    const r = await fetch(`${BASE}/transit/stops/${code}/next?limit=5`).then((x) => x.json());
    setNext((m) => ({ ...m, [code]: r.next }));
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h1>Jadwal Transit</h1>
      <p>Jadwal statis, update manual dari jadwal resmi. Bukan inti matching.</p>
      {stops.map((s) => (
        <div key={s.code} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
          <b>{s.name}</b> · {s.mode} · {s.corridor}
          <button style={{ marginLeft: 8 }} onClick={() => show(s.code)}>Berikutnya</button>
          {next[s.code] && <p>{next[s.code].join(' · ') || 'Habis hari ini.'}</p>}
        </div>
      ))}
    </main>
  );
}
