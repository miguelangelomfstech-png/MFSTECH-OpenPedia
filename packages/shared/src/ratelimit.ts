import { redis } from "./queues";

/**
 * Fixed-window counter in Redis. Fails open if Redis is unavailable so that
 * an infrastructure blip never takes the whole site down.
 */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl || redisUrl.includes("localhost") || redisUrl.includes("127.0.0.1")) {
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      return { ok: true, remaining: limit, retryAfter: 0 };
    }
  }

  try {
    const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
    const client = redis();
    const incrPromise = client.incr(k);
    const timeoutPromise = new Promise<number>((_, reject) =>
      setTimeout(() => reject(new Error("Redis timeout")), 500)
    );
    const n = await Promise.race([incrPromise, timeoutPromise]);
    if (n === 1) await client.expire(k, windowSec + 1).catch(() => {});
    return { ok: n <= limit, remaining: Math.max(0, limit - n), retryAfter: windowSec };
  } catch {
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
}

export const LIMITS = {
  editAnon: { limit: 6, window: 60 },
  editUser: { limit: 20, window: 60 },
  upload: { limit: 10, window: 600 },
  register: { limit: 5, window: 3600 },
  login: { limit: 10, window: 300 },
  api: { limit: 120, window: 60 },
} as const;
