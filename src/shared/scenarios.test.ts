import { describe, expect, it } from 'vitest'
import { isInappropriate } from './profanity'
import { SCENARIOS } from './scenarios'
import { checkLessonRequest, wordProblem } from './validate-request'

describe('SCENARIOS', () => {
  it('has the 4 situations with unique ids', () => {
    expect(SCENARIOS.map((s) => s.id).sort()).toEqual(['cafe', 'clinic', 'supermarket', 'taxi'])
  })

  for (const s of SCENARIOS) {
    it(`${s.id} has 10-15 unique suggested words`, () => {
      expect(s.suggestedWords.length).toBeGreaterThanOrEqual(10)
      expect(s.suggestedWords.length).toBeLessThanOrEqual(15)
      const keys = s.suggestedWords.map((w) => w.toLowerCase())
      expect(new Set(keys).size).toBe(keys.length)
    })

    it(`${s.id} suggested words all pass the request word rule`, () => {
      for (const w of s.suggestedWords) {
        const others = s.suggestedWords.filter((x) => x !== w).slice(0, 2)
        const r = checkLessonRequest({ scenarioId: s.id, words: [w, ...others], level: 1 })
        expect(r.ok ? 'ok' : r.errors).toBe('ok')
      }
    })
  }

  it('has extra batches of valid, clean words that repeat nothing else at the place', () => {
    for (const s of SCENARIOS) {
      expect(s.moreWords.length, s.id).toBeGreaterThanOrEqual(1)
      for (const batch of s.moreWords) expect(batch.length, s.id).toBeGreaterThanOrEqual(10)
      const all = [s.suggestedWords, ...s.moreWords].flat()
      expect(new Set(all.map((w) => w.toLowerCase())).size, s.id).toBe(all.length)
      for (const w of all) {
        expect(wordProblem(w), w).toBeNull()
        expect(isInappropriate(w), w).toBe(false)
      }
    }
  })
})
