import { doorAt, isWalkable, type CityMap, type Pos } from './map'

export type Dir = 'up' | 'down' | 'left' | 'right'

export const DELTA: Record<Dir, Pos> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

/** Move one tile if the target is walkable. Reports the place when the step lands on a door. */
export function step(map: CityMap, from: Pos, dir: Dir): { pos: Pos; enteredPlace?: string } {
  const to = { x: from.x + DELTA[dir].x, y: from.y + DELTA[dir].y }
  if (!isWalkable(map, to)) return { pos: from }
  const door = doorAt(map, to)
  return door ? { pos: to, enteredPlace: door.placeId } : { pos: to }
}

const KEYS: Record<string, Dir> = {
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

export function keyToDir(key: string): Dir | undefined {
  return KEYS[key.toLowerCase()]
}
