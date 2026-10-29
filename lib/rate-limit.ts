const WINDOW_SEC = 15 * 60 // 15 minutes
const MAX_ATTEMPTS = 5

// In-memory fallback — lost on cold start, but still limits within a warm instance
const memory = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(key: string): Promise<{ limited: boolean; remaining: number }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    try {
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({ url: redisUrl, token: redisToken })
      const rk = `rate_limit:${key}`
      const count = await redis.incr(rk)
      if (count === 1) await redis.expire(rk, WINDOW_SEC)
      return { limited: count > MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - count) }
    } catch { /* fall through */ }
  }

  const now = Date.now()
  const existing = memory.get(key)
  if (!existing || now > existing.resetAt) {
    memory.set(key, { count: 1, resetAt: now + WINDOW_SEC * 1000 })
    return { limited: false, remaining: MAX_ATTEMPTS - 1 }
  }
  existing.count++
  return { limited: existing.count > MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - existing.count) }
}

export async function clearRateLimit(key: string): Promise<void> {
  memory.delete(key)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (redisUrl && redisToken) {
    try {
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({ url: redisUrl, token: redisToken })
      await redis.del(`rate_limit:${key}`)
    } catch { /* ignore */ }
  }
}
