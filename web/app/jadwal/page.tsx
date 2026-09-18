'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function Jadwal() {
  const [rows, setRows] = useState<{ day: number; depart: string; ret: string }[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/schedule/me')
      .then((r: any[]) => setRows(r.map((x) => ({ day: x.day_of_week, depart: x.depart_time.slice(0, 5), ret: x.return_time.slice(0, 5) }))))
      .catch(() => {});
  }, []);

  function toggle(day: number) {
    setRows((rows.some((r) => r.day === day) ? rows.filter((r) => r.day !== day) : [...rows, { day, depart: '07:00', ret: '17:00' }]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/schedule', { method: 'PUT', body: JSON.stringify({ days: rows }) });
      setMsg('Jadwal tersimpan. Jam offer carpool terisi otomatis dari sini.');
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Jadwal Kerja</h1>
      <form onSubmit={save} style={{ display: 'grid', gap: 8 }}>
        {HARI.map((h, day) => {
          const r = rows.find((x) => x.day === day);
          return (
            <div key={day} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label><input type="checkbox" checked={!!r} onChange={() => toggle(day)} /> {h}</label>
              {r && (
                <>
                  <input type="time" value={r.depart} onChange={(e) => setRows(rows.map((x) => x.day === day ? { ...x, depart: e.target.value } : x))} />
                  <input type="time" value={r.ret} onChange={(e) => setRows(rows.map((x) => x.day === day ? { ...x, ret: e.target.value } : x))} />
                </>
              )}
            </div>
          );
        })}
        <button type="submit">Simpan</button>
      </form>
      <p>{msg}</p>
    </main>
  );
}
