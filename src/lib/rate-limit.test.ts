import { describe, expect, it } from 'vitest'
import { createRateLimiter } from './rate-limit'

describe('createRateLimiter', () => {
  it('allows up to the limit per window, per key, then frees up as time passes', () => {
    let t = 0
    const allow = createRateLimiter(2, 1000, () => t)
    expect(allow('a')).toBe(true)
    expect(allow('a')).toBe(true)
    expect(allow('a')).toBe(false)
    expect(allow('b')).toBe(true)
    t = 999
    expect(allow('a')).toBe(false)
    t = 1000
    expect(allow('a')).toBe(true)
  })
})
