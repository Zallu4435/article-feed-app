import type { ApiOptions } from '@/types';

export const apiFetch = async <T>(path: string, opts: ApiOptions = {}): Promise<T> => {
  const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  if (opts.query) {
    Object.entries(opts.query).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }

  // Helper to actually make the fetch
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
      credentials: 'include', // Send cookies!
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text as any; }
    return { res, data };
  };

  let { res, data } = await doFetch();

  if (res.status === 401) {
    // Try to refresh the access token
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      // Retry the original request once
      ({ res, data } = await doFetch());
    }
  }

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText;
    throw new Error(msg);
  }

  return data as T;
};
