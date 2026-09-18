'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Profil() {
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    api('/auth/me')
      .then(setMe)
      .catch(() => {});
    api('/verifications/me')
      .then((v) => setMe((m: any) => ({ ...m, ...v })))
      .catch(() => {});
  }, []);

  if (!me) return <main style={{ padding: 24 }}>Belum login. Daftar di /register</main>;
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>{me.name}</h1>
      <p>{me.phone} {me.phone_verified ? '(OTP ✓)' : ''}</p>
      <p>
        {me.badge_terverifikasi || me.verification_status === 'verified'
          ? 'Badge: Terverifikasi ✓'
          : `Status: ${me.verification_status ?? '-'}`}
      </p>
    </main>
  );
}
