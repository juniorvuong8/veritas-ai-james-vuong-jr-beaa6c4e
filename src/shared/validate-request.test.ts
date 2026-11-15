import { describe, expect, it } from 'vitest'
import { checkLessonRequest } from './validate-request'

const valid = { scenarioId: 'cafe', words: ['menu', 'to go', 'receipt'], level: 1 }

describe('checkLessonRequest', () => {
  it('accepts a valid request', () => {
    const r = checkLessonRequest(valid)
    expect(r.ok).toBe(true)
  })

  it('rejects unknown scenario', () => {
    expect(checkLessonRequest({ ...valid, scenarioId: 'moon' }).ok).toBe(false)
  })

  it('rejects level 0 and 4', () => {
    expect(checkLessonRequest({ ...valid, level: 0 }).ok).toBe(false)
    expect(checkLessonRequest({ ...valid, level: 4 }).ok).toBe(false)
  })

  it('rejects 2 words and 6 words', () => {
    expect(checkLessonRequest({ ...valid, words: ['menu', 'to go'] }).ok).toBe(false)
    expect(
      checkLessonRequest({ ...valid, words: ['menu', 'to go', 'receipt', 'straw', 'napkin', 'iced'] }).ok,
    ).toBe(false)
  })

  it('rejects duplicates ignoring case and spaces', () => {
    expect(checkLessonRequest({ ...valid, words: ['menu', 'Menu ', 'receipt'] }).ok).toBe(false)
  })

  it('rejects a word over 30 chars', () => {
    expect(checkLessonRequest({ ...valid, words: ['menu', 'to go', 'a'.repeat(31)] }).ok).toBe(false)
  })

  it('rejects digits or symbols', () => {
    expect(checkLessonRequest({ ...valid, words: ['menu1', 'to go', 'receipt'] }).ok).toBe(false)
    expect(checkLessonRequest({ ...valid, words: ['<b>', 'to go', 'receipt'] }).ok).toBe(false)
  })

  it('rejects non-object body', () => {
    expect(checkLessonRequest(null).ok).toBe(false)
    expect(checkLessonRequest('x').ok).toBe(false)
  })

  it('accepts Vietnamese with diacritics', () => {
    expect(checkLessonRequest({ ...valid, words: ['hóa đơn', 'menu', 'to go'] }).ok).toBe(true)
  })

  it('accepts NFD input and normalizes to NFC', () => {
    const nfd = 'hóa đơn'.normalize('NFD')
    const r = checkLessonRequest({ ...valid, words: [nfd, 'menu', 'to go'] })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.words[0]).toBe('hóa đơn'.normalize('NFC'))
  })

  it('treats NFD and NFC copies of a word as duplicates', () => {
    const words = ['hóa đơn'.normalize('NFD'), 'hóa đơn'.normalize('NFC'), 'menu']
    expect(checkLessonRequest({ ...valid, words }).ok).toBe(false)
  })
})

describe('isValidWord', () => {
  it('rejects punctuation-only words', async () => {
    const { isValidWord } = await import('./validate-request.ts')
    expect(isValidWord('-')).toBe(false)
    expect(isValidWord("'")).toBe(false)
    expect(isValidWord('coffee2')).toBe(false)
    expect(isValidWord('hóa đơn')).toBe(true)
  })
})

describe('normalizeWord', () => {
  it('turns a curly apostrophe into a straight one', async () => {
    const { normalizeWord } = await import('./scenarios.ts')
    expect(normalizeWord('I’d like')).toBe("I'd like")
  })

  it('passes debug through only when it is exactly true', () => {
    const on = checkLessonRequest({ ...valid, debug: true })
    expect(on.ok && on.value.debug).toBe(true)
    const odd = checkLessonRequest({ ...valid, debug: 'yes' })
    expect(odd.ok && 'debug' in odd.value).toBe(false)
  })
})
