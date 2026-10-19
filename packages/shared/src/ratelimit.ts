import { redis } from "./queues";

/**
 * Fixed-window counter in Redis. Fails open if Redis is unavailable so that
 * an infrastructure blip never takes the whole site down.
 */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  try {
    const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
    const n = await redis().incr(k);
    if (n === 1) await redis().expire(k, windowSec + 1);
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
