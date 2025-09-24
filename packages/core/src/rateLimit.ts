const buckets = new Map<string, { tokens: number; last: number }>()

export function rateLimit(key: string, maxPerMinute: number): boolean {
  const now = Date.now()
  const minute = 60_000
  const refillRate = maxPerMinute / minute
  let b = buckets.get(key)
  if (!b) {
    b = { tokens: maxPerMinute, last: now }
    buckets.set(key, b)
  }
  const elapsed = now - b.last
  b.tokens = Math.min(maxPerMinute, b.tokens + elapsed * refillRate)
  b.last = now
  if (b.tokens >= 1) {
    b.tokens -= 1
    return true
  }
  return false
}

