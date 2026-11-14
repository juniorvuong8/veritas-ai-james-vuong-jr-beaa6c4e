import { describe, expect, it } from 'vitest'
import { parseMap } from './map'
import { keyToDir, step } from './movement'

const m = parseMap(['CC..', 'c@.^', '....'], { c: 'cafe' })
const start = { x: 1, y: 1 }

describe('step', () => {
  it('does not walk into a building', () => {
    expect(step(m, start, 'up')).toEqual({ pos: start })
  })
  it('does not walk into a tree', () => {
    expect(step(m, { x: 2, y: 1 }, 'right')).toEqual({ pos: { x: 2, y: 1 } })
  })
  it('does not walk off the map', () => {
    expect(step(m, { x: 0, y: 2 }, 'down')).toEqual({ pos: { x: 0, y: 2 } })
  })
  it('reports entering a place when stepping onto its door', () => {
    expect(step(m, start, 'left')).toEqual({ pos: { x: 0, y: 1 }, enteredPlace: 'cafe' })
  })
  it('moves onto road', () => {
    expect(step(m, start, 'down')).toEqual({ pos: { x: 1, y: 2 } })
  })
})

describe('keyToDir', () => {
  it('maps arrows and WASD', () => {
    expect(keyToDir('ArrowUp')).toBe('up')
    expect(keyToDir('D')).toBe('right')
    expect(keyToDir('s')).toBe('down')
    expect(keyToDir('a')).toBe('left')
    expect(keyToDir('x')).toBeUndefined()
  })
})
