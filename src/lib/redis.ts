import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  if (globalForRedis.redis) return globalForRedis.redis;

  const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
  }

  return redis;
}

const redis = getRedisClient();

const CACHE_TTL = 300; // 5 minutes

export async function getCachedMenu(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get(`menu:${key}`);
  } catch {
    return null;
  }
}

export async function setCachedMenu(key: string, data: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(`menu:${key}`, data, "EX", CACHE_TTL);
  } catch {
    // Silently fail — cache miss is fine
  }
}

export async function invalidateMenuCache(restaurantSlug: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(`menu:${restaurantSlug}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silently fail
  }
}

export default redis;
