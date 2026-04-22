import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function storageSet(key: string, value: unknown): Promise<void> {
  await redis.set(key, value);
}

export async function storageGet<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function storageKeys(pattern: string): Promise<string[]> {
  return redis.keys(pattern);
}

export async function storageMget(keys: string[]): Promise<unknown[]> {
  if (keys.length === 0) return [];
  return redis.mget(...keys);
}

export async function storageDelete(keys: Array<string>): Promise<void> {
  if (keys.length === 0) return;
  await Promise.all(keys.map((k) => redis.del(k)));
}
