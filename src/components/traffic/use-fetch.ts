"use client";

import { useEffect, useState, useCallback } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Lightweight fetch hook for GET endpoints.
 * State is derived from the resolved request url to avoid cascading renders.
 */
export function useFetch<T>(url: string | null, opts?: { intervalMs?: number }): FetchState<T> {
  const [state, setState] = useState<{ data: T | null; error: string | null; url: string | null }>({
    data: null,
    error: null,
    url: null,
  });
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!url) return;
    let active = true;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = (await r.json()) as T;
        if (active) setState({ data: json, error: null, url });
      })
      .catch((e) => {
        if (active) setState({ data: null, error: (e as Error).message, url });
      });
    return () => {
      active = false;
    };
  }, [url, tick]);

  useEffect(() => {
    if (!opts?.intervalMs) return;
    const id = setInterval(refresh, opts.intervalMs);
    return () => clearInterval(id);
  }, [opts?.intervalMs, refresh]);

  const current = url === state.url ? state : { data: null, error: null, url: null };
  return {
    data: current.data,
    loading: !!url && state.url !== url,
    error: current.error,
    refresh,
  };
}

/** POST helper returning JSON. */
export async function postJSON<T = unknown>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** PATCH helper. */
export async function patchJSON<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** DELETE helper. */
export async function delJSON<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
