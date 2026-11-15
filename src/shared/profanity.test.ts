import { describe, expect, it } from 'vitest'
import { isInappropriate } from './profanity'
import { SCENARIOS } from './scenarios'

describe('isInappropriate', () => {
  it('blocks English profanity, including variants and spaced-out spelling', () => {
    for (const w of ['fuck', 'Fucking', 'fuuuck', 'f u c k', 'shitty', 'mother fucker', 'ass', 'ass hole', 'bitch'])
      expect(isInappropriate(w), w).toBe(true)
  })

  it('blocks Vietnamese profanity with and without diacritics', () => {
    for (const w of ['địt', 'đụ má', 'lồn', 'đồ chó', 'dit me', 'vcl', 'đm']) expect(isInappropriate(w), w).toBe(true)
  })

  it('allows every suggested word', () => {
    for (const s of SCENARIOS) for (const w of s.suggestedWords) expect(isInappropriate(w), w).toBe(false)
  })

  it('allows innocent words that contain or resemble blocked ones', () => {
    for (const w of [
      'class', 'glass', 'passport', 'assistant', 'cocktail', 'scrap', 'Dickens', 'hello', 'du lịch', 'lon nước',
      'đi', 'cho', 'chó', 'con chó', 'hóa đơn', 'bàn chải', 'pain', 'pharmacy', 'beer',
    ])
      expect(isInappropriate(w), w).toBe(false)
  })
})
