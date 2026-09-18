'use client';
import { useState } from 'react';
import { api } from '../../lib/api';

export default function Register() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/auth/register', { method: 'POST', body: JSON.stringify({ phone, name }) });
      const r = await api('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) });
      setMsg(r.dev_code ? `Kode dev: ${r.dev_code}` : 'Kode OTP terkirim');
      setStep('otp');
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await api('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, code }) });
      localStorage.setItem('searah_token', r.token);
      setMsg('Berhasil masuk. Lanjut ke /verifikasi');
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Daftar SEARAH</h1>
      <p>Nomor HP wajib OTP. Verifikasi KTP opsional, tapi dapat badge terverifikasi.</p>
      {step === 'form' ? (
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <input placeholder="08xx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} required />
          <button type="submit">Kirim OTP</button>
        </form>
      ) : (
        <form onSubmit={verify} style={{ display: 'grid', gap: 12 }}>
          <input placeholder="Kode OTP" value={code} onChange={(e) => setCode(e.target.value)} required />
          <button type="submit">Verifikasi</button>
        </form>
      )}
      <p>{msg}</p>
    </main>
  );
}
