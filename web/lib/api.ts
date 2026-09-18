const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function token(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('searah_token');
}

export async function api(path: string, opts: RequestInit = {}) {
  const t = token();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
