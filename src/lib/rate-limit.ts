/**
 * A small in-memory limiter: at most `limit` hits per `windowMs` for each key.
 * Best effort: each server instance keeps its own counts, so it stops runaway scripts, not a determined attacker.
 */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>()
  return function allow(key: string): boolean {
    const t = now()
    const recent = (hits.get(key) ?? []).filter((at) => t - at < windowMs)
    if (recent.length >= limit) {
      hits.set(key, recent)
      return false
    }
    recent.push(t)
    hits.set(key, recent)
    // Drop keys nobody has used for a while so the map can't grow without bound.
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.every((at) => t - at >= windowMs)) hits.delete(k)
    return true
  }
}
