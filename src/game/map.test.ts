import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '@/shared/scenarios'
import { PLACE_ART } from './art'
import { CITY, isWalkable, parseMap } from './map'

describe('parseMap', () => {
  it('parses a tiny map', () => {
    const m = parseMap(['CC.', 'c@.'], { c: 'cafe' })
    expect(m.width).toBe(3)
    expect(m.height).toBe(2)
    expect(m.tiles[0][0]).toBe('building')
    expect(m.doors).toEqual([{ placeId: 'cafe', pos: { x: 0, y: 1 }, outside: { x: 1, y: 1 } }])
    expect(m.start).toEqual({ x: 1, y: 1 })
    expect(m.placeAt[0][1]).toBe('cafe')
    expect(m.placeAt[1][2]).toBeNull()
  })

  it('rejects ragged rows', () => {
    expect(() => parseMap(['CC.', 'c@'], { c: 'cafe' })).toThrow()
  })

  it('rejects a map without a start', () => {
    expect(() => parseMap(['CC.', 'c..'], { c: 'cafe' })).toThrow()
  })

  it('rejects a place with two doors', () => {
    expect(() => parseMap(['cC.', 'c@.'], { c: 'cafe' })).toThrow()
  })

  it('rejects an unknown letter', () => {
    expect(() => parseMap(['CC?', 'c@.'], { c: 'cafe' })).toThrow()
  })
})

describe('CITY', () => {
  it('has one door per scenario', () => {
    expect(CITY.doors.map((d) => d.placeId).sort()).toEqual(SCENARIOS.map((s) => s.id).sort())
  })

  it('is about 10×8', () => {
    expect(CITY.width).toBeGreaterThanOrEqual(9)
    expect(CITY.width).toBeLessThanOrEqual(12)
    expect(CITY.height).toBeGreaterThanOrEqual(7)
    expect(CITY.height).toBeLessThanOrEqual(9)
  })
  it('has a fountain in the center that you walk around, and no water', () => {
    const center = { x: Math.floor(CITY.width / 2), y: Math.floor(CITY.height / 2) }
    expect(CITY.tiles[center.y][center.x]).toBe('fountain')
    expect(isWalkable(CITY, center)).toBe(false)
    expect(isWalkable(CITY, CITY.start)).toBe(true)
    expect(CITY.tiles.flat()).not.toContain('water')
  })
})

describe('isWalkable', () => {
  const m = parseMap(['CC^~', 'c@,.'], { c: 'cafe' })
  it('allows road, grass and doors', () => {
    expect(isWalkable(m, { x: 1, y: 1 })).toBe(true)
    expect(isWalkable(m, { x: 2, y: 1 })).toBe(true)
    expect(isWalkable(m, { x: 0, y: 1 })).toBe(true)
  })
  it('blocks buildings, trees, water and out of bounds', () => {
    expect(isWalkable(m, { x: 0, y: 0 })).toBe(false)
    expect(isWalkable(m, { x: 2, y: 0 })).toBe(false)
    expect(isWalkable(m, { x: 3, y: 0 })).toBe(false)
    expect(isWalkable(m, { x: -1, y: 0 })).toBe(false)
    expect(isWalkable(m, { x: 0, y: 2 })).toBe(false)
  })
})

describe('PLACE_ART', () => {
  it('has art for every place', () => {
    for (const s of SCENARIOS) {
      expect(PLACE_ART[s.id]?.sign).toBeTruthy()
      expect(PLACE_ART[s.id]?.host).toBeTruthy()
      expect(PLACE_ART[s.id]?.greeting_vi).toBeTruthy()
    }
  })
})
