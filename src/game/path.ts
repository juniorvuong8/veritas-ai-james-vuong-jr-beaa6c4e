import { doorOf, isWalkable, samePos, type CityMap, type Pos } from './map'
import { DELTA } from './movement'

/**
 * Shortest 4-directional path (BFS). Excludes `from`, includes `to`.
 * Door tiles are only entered when they are the target.
 */
export function findPath(map: CityMap, from: Pos, to: Pos): Pos[] | null {
  if (samePos(from, to)) return []
  if (!isWalkable(map, to)) return null
  const key = (p: Pos) => p.y * map.width + p.x
  const prev = new Map<number, Pos | null>([[key(from), null]])
  const queue: Pos[] = [from]
  while (queue.length > 0) {
    const cur = queue.shift()!
    for (const d of Object.values(DELTA)) {
      const next = { x: cur.x + d.x, y: cur.y + d.y }
      if (prev.has(key(next)) || !isWalkable(map, next)) continue
      const isTarget = samePos(next, to)
      if (map.tiles[next.y][next.x] === 'door' && !isTarget) continue
      prev.set(key(next), cur)
      if (isTarget) {
        const path: Pos[] = []
        for (let p: Pos | null = next; p && !samePos(p, from); p = prev.get(key(p)) ?? null) path.unshift(p)
        return path
      }
      queue.push(next)
    }
  }
  return null
}

/** Where a tap should send the player: walkable tiles as is, buildings to their door, else nowhere. */
export function resolveTapTarget(map: CityMap, tapped: Pos): Pos | null {
  if (isWalkable(map, tapped)) return tapped
  const place = map.placeAt[tapped.y]?.[tapped.x]
  return place ? doorOf(map, place).pos : null
}
