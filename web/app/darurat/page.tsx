'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Darurat() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  function load() {
    api('/safety/contacts').then(setContacts).catch(() => {});
  }
  useEffect(load, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/safety/contacts', { method: 'POST', body: JSON.stringify({ name, phone }) });
      setName(''); setPhone(''); load();
    } catch (e: any) { setMsg(e.message); }
  }

  async function sos() {
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation?.getCurrentPosition(res, rej));
      const r = await api('/safety/sos', {
        method: 'POST',
        body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      });
      setMsg(`SOS tercatat. Segera hubungi: ${r.call.join(', ')}.`);
    } catch {
      try {
        const r = await api('/safety/sos', { method: 'POST', body: '{}' });
        setMsg(`SOS tercatat (tanpa lokasi). Segera hubungi: ${r.call.join(', ')}.`);
      } catch (e: any) { setMsg(e.message); }
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Darurat</h1>
      <button onClick={sos} style={{ background: '#c00', color: '#fff', padding: '12px 24px', fontSize: 18, border: 0 }}>
        SOS DARURAT
      </button>
      <p>{msg}</p>
      <h2>Kontak darurat</h2>
      <form onSubmit={add} style={{ display: 'flex', gap: 8 }}>
        <input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Nomor" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <button type="submit">Tambah</button>
      </form>
      <ul>
        {contacts.map((c) => (
          <li key={c.id}>{c.name} · {c.phone}
            <button style={{ marginLeft: 8 }} onClick={async () => { await api(`/safety/contacts/${c.id}`, { method: 'DELETE' }); load(); }}>Hapus</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
