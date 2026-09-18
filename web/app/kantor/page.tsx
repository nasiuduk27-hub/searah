'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function KantorInner() {
  const q = useSearchParams();
  const [email, setEmail] = useState('');
  const [me, setMe] = useState<any>(null);
  const [msg, setMsg] = useState('');

  function load() {
    api('/office/me').then(setMe).catch(() => {});
  }
  useEffect(load, []);

  useEffect(() => {
    const token = q.get('token');
    if (!token) return;
    fetch(`${BASE}/office/verify?token=${token}`)
      .then((r) => { if (!r.ok) throw new Error('token invalid'); return r.json(); })
      .then(() => { setMsg('Email kantor terverifikasi ✓'); load(); })
      .catch(() => setMsg('Link tidak valid/kedaluwarsa.'));
  }, [q]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await api('/office/request', { method: 'POST', body: JSON.stringify({ email }) });
      setMsg(r.dev_token ? `Link dev: /kantor?token=${r.dev_token}` : 'Link verifikasi dikirim ke email.');
      load();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Email Kantor</h1>
      <p>Opsional. {me?.office_email_verified ? `Terverifikasi ✓ (${me.office_email})` : 'Tingkatkan kepercayaan dengan email perusahaan.'}</p>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <input placeholder="nama@perusahaan.co.id" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ flex: 1 }} />
        <button type="submit">Kirim link</button>
      </form>
      <p>{msg}</p>
    </main>
  );
}

export default function Kantor() {
  return <Suspense><KantorInner /></Suspense>;
}
