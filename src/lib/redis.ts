import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  if (globalForRedis.redis) return globalForRedis.redis;

  try {
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        // Stop retrying after 3 attempts — Redis is optional
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    // Attach an error handler so unhandled 'error' events don't crash the process
    redis.on("error", (err) => {
      // Log once, then silence — Redis is an optional cache layer
      if (process.env.NODE_ENV === "development") {
        console.warn("[redis] Connection failed (cache disabled):", err.message);
      }
    });

    if (process.env.NODE_ENV !== "production") {
      globalForRedis.redis = redis;
    }

    return redis;
  } catch {
    return null;
  }
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
    // Delete the exact restaurant cache key (menu:restaurant:{slug})
    await redis.del(`menu:restaurant:${restaurantSlug}`);

    // Also delete any pattern-based keys (menu:{slug}:*)
    const keys = await redis.keys(`menu:${restaurantSlug}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    // Also delete restaurant:slug pattern
    const restaurantKeys = await redis.keys(`menu:restaurant:${restaurantSlug}*`);
    if (restaurantKeys.length > 0) {
      await redis.del(...restaurantKeys);
    }
  } catch {
    // Silently fail
  }
}

export default redis;
