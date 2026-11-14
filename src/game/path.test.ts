import { describe, expect, it } from 'vitest'
import { CITY, isWalkable, parseMap, type Pos } from './map'
import { findPath, resolveTapTarget } from './path'

const adjacent = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1

describe('findPath', () => {
  const m = parseMap(['@.^.', '..^.', '....'], { })
  it('finds the shortest path around a wall', () => {
    const path = findPath(m, { x: 0, y: 0 }, { x: 3, y: 0 })!
    expect(path).toHaveLength(7)
    let prev = { x: 0, y: 0 }
    for (const p of path) {
      expect(adjacent(prev, p)).toBe(true)
      expect(isWalkable(m, p)).toBe(true)
      prev = p
    }
    expect(path.at(-1)).toEqual({ x: 3, y: 0 })
  })

  it('returns [] when already there', () => {
    expect(findPath(m, { x: 0, y: 0 }, { x: 0, y: 0 })).toEqual([])
  })

  it('returns null for an unreachable target', () => {
    const w = parseMap(['@.~.', '..~.'], {})
    expect(findPath(w, { x: 0, y: 0 }, { x: 3, y: 0 })).toBeNull()
  })

  it('never walks through a door it was not sent to', () => {
    const d = parseMap(['CC^', '@c.', '^^.'], { c: 'cafe' })
    // the only route to (2,2) passes through the door at (1,1)
    expect(findPath(d, { x: 0, y: 1 }, { x: 2, y: 2 })).toBeNull()
  })

  it('reaches every CITY door within 12 steps of the start', () => {
    for (const door of CITY.doors) {
      const path = findPath(CITY, CITY.start, door.pos)
      expect(path, door.placeId).not.toBeNull()
      expect(path!.length, door.placeId).toBeLessThanOrEqual(12)
    }
  })
})

describe('resolveTapTarget', () => {
  const m = parseMap(['CC^', 'c@.'], { c: 'cafe' })
  it('sends a building tap to its door', () => {
    expect(resolveTapTarget(m, { x: 1, y: 0 })).toEqual({ x: 0, y: 1 })
  })
  it('keeps a walkable tile', () => {
    expect(resolveTapTarget(m, { x: 2, y: 1 })).toEqual({ x: 2, y: 1 })
  })
  it('ignores a tree', () => {
    expect(resolveTapTarget(m, { x: 2, y: 0 })).toBeNull()
  })
})
