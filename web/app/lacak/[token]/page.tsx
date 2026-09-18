'use client';
import { use, useEffect, useState } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Lacak({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [pts, setPts] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function poll() {
      try {
        const r = await fetch(`${BASE}/share/${token}/track`);
        if (!r.ok) return setMsg('Link tidak valid/kedaluwarsa.');
        setPts(await r.json());
      } catch { setMsg('Gagal memuat.'); }
    }
    poll();
    const t = setInterval(poll, 15000);
    return () => clearInterval(t);
  }, [token]);

  const last = pts[pts.length - 1];
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Lacak Perjalanan</h1>
      {last
        ? <p>Terakhir: {Number(last.lat).toFixed(5)}, {Number(last.lng).toFixed(5)} ({new Date(last.created_at).toLocaleTimeString('id-ID')})</p>
        : <p>{msg || 'Belum ada lokasi dibagikan.'}</p>}
      <ul>{pts.map((p, i) => <li key={i}>{Number(p.lat).toFixed(5)}, {Number(p.lng).toFixed(5)}</li>)}</ul>
    </main>
  );
}
