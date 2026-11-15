import { describe, expect, it } from 'vitest'
import { PLAYER_EMOJI } from './art'
import { outfitEmojis } from './shop'

describe('outfitEmojis', () => {
  it('uses the plain face for each gender when no look is worn', () => {
    expect(outfitEmojis({}).face).toBe(PLAYER_EMOJI)
    expect(outfitEmojis({}, 'male').face).toBe('👨')
    expect(outfitEmojis({}, 'female').face).toBe('👩')
  })

  it('matches looks to the gender, and leaves hats and pets alone', () => {
    const outfit = { look: 'redhair', hat: 'cap', pet: 'cat' }
    expect(outfitEmojis(outfit)).toEqual({ face: '🧑‍🦰', hat: '🧢', pet: '🐱' })
    expect(outfitEmojis(outfit, 'male').face).toBe('👨‍🦰')
    expect(outfitEmojis(outfit, 'female').face).toBe('👩‍🦰')
  })
})
