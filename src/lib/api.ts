import type { ApiOptions } from '@/types';

export const apiFetch = async <T>(path: string, opts: ApiOptions = {}): Promise<T> => {
  const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  if (opts.query) {
    Object.entries(opts.query).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }

  const doFetch = async () => {
    const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
    const res = await fetch(url.toString(), {
      method: opts.method || 'GET',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(opts.headers || {}),
      },
      body: opts.body ? (isFormData ? opts.body : JSON.stringify(opts.body)) : undefined,
      cache: 'no-store',
      credentials: 'include', 
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text as any; }
    return { res, data };
  };

  let { res, data } = await doFetch();

  if (res.status === 401 || res.status === 403) {
    const refreshUrl = new URL('/api/auth/refresh', url.origin);
    const refreshRes = await fetch(refreshUrl.toString(), {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      ({ res, data } = await doFetch());
    }
  }

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText;
    throw new Error(msg);
  }

  return data as T;
};
