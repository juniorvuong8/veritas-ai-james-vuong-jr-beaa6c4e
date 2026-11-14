import { describe, expect, it } from 'vitest'
import { addWord, canSubmit, toggleWord } from './selection'

describe('addWord', () => {
  it('adds up to 5 words and ignores the 6th', () => {
    let s: string[] = []
    for (const w of ['a', 'b', 'c', 'd', 'e', 'f']) s = addWord(s, w)
    expect(s).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
  it('ignores a case-insensitive duplicate with extra spaces', () => {
    expect(addWord(['menu'], 'Menu ')).toEqual(['menu'])
  })
  it('ignores empty input', () => {
    expect(addWord(['menu'], '   ')).toEqual(['menu'])
  })
  it('normalizes the added word', () => {
    expect(addWord([], '  hóa   đơn '.normalize('NFD'))).toEqual(['hóa đơn'.normalize('NFC')])
  })
})

describe('toggleWord', () => {
  it('adds and removes', () => {
    expect(toggleWord(['menu'], 'receipt')).toEqual(['menu', 'receipt'])
    expect(toggleWord(['menu', 'receipt'], 'menu')).toEqual(['receipt'])
  })
})

describe('canSubmit', () => {
  it('needs 3 to 5 words', () => {
    expect(canSubmit(['a', 'b'])).toBe(false)
    expect(canSubmit(['a', 'b', 'c'])).toBe(true)
    expect(canSubmit(['a', 'b', 'c', 'd', 'e'])).toBe(true)
  })
})
