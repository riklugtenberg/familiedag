// Abstractielaag: gebruikt Vercel KV in productie, in-memory Map lokaal.

const hasKv =
  typeof process.env.KV_REST_API_URL === 'string' &&
  process.env.KV_REST_API_URL.length > 0 &&
  typeof process.env.KV_REST_API_TOKEN === 'string' &&
  process.env.KV_REST_API_TOKEN.length > 0;

// In-memory fallback (verdwijnt bij server-restart, alleen voor lokaal testen)
const memStore = new Map<string, unknown>();

export async function storageSet(key: string, value: unknown): Promise<void> {
  if (hasKv) {
    const { kv } = await import('@vercel/kv');
    await kv.set(key, value);
  } else {
    memStore.set(key, value);
  }
}

export async function storageGet<T>(key: string): Promise<T | null> {
  if (hasKv) {
    const { kv } = await import('@vercel/kv');
    return kv.get<T>(key);
  }
  return (memStore.get(key) as T) ?? null;
}

export async function storageKeys(pattern: string): Promise<string[]> {
  if (hasKv) {
    const { kv } = await import('@vercel/kv');
    return kv.keys(pattern);
  }
  // Eenvoudige glob: ondersteunt alleen trailing *
  const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
  return [...memStore.keys()].filter((k) => k.startsWith(prefix));
}

export async function storageMget(keys: string[]): Promise<unknown[]> {
  if (keys.length === 0) return [];
  if (hasKv) {
    const { kv } = await import('@vercel/kv');
    return kv.mget(...keys);
  }
  return keys.map((k) => memStore.get(k) ?? null);
}
