'use client';
import { useState } from 'react';
import { api } from '../../lib/api';

function toB64(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export default function Verifikasi() {
  const [msg, setMsg] = useState('');

  async function upload(doc_type: string, f: File | undefined) {
    if (!f) return;
    try {
      const data_base64 = await toB64(f);
      await api('/verifications', { method: 'POST', body: JSON.stringify({ doc_type, data_base64 }) });
      setMsg(`${doc_type} terkirim, menunggu review manual.`);
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Verifikasi Tingkat 1</h1>
      <p>Foto KTP + selfie direview manual. Hanya badge yang tampil publik, file terenkripsi.</p>
      <label>
        Foto KTP
        <input type="file" accept="image/*" capture="environment" onChange={(e) => upload('ktp', e.target.files?.[0])} />
      </label>
      <br />
      <br />
      <label>
        Selfie
        <input type="file" accept="image/*" capture="user" onChange={(e) => upload('selfie', e.target.files?.[0])} />
      </label>
      <p>{msg}</p>
    </main>
  );
}
