export type Pos = { x: number; y: number }
export type Tile = 'road' | 'grass' | 'tree' | 'water' | 'building' | 'door'

export interface Door {
  placeId: string
  pos: Pos
  /** Walkable tile just outside the door, where the player stands after leaving. */
  outside: Pos
}

export interface CityMap {
  width: number
  height: number
  tiles: Tile[][]
  /** Place id for each building or door tile, null elsewhere. Indexed [y][x]. */
  placeAt: (string | null)[][]
  doors: Door[]
  start: Pos
}

const SIMPLE: Record<string, Tile> = { '.': 'road', '@': 'road', ',': 'grass', '^': 'tree', '~': 'water' }

export const samePos = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y

export function inBounds(map: CityMap, p: Pos): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < map.width && p.y < map.height
}

export function isWalkable(map: CityMap, p: Pos): boolean {
  if (!inBounds(map, p)) return false
  const t = map.tiles[p.y][p.x]
  return t === 'road' || t === 'grass' || t === 'door'
}

export function doorAt(map: CityMap, p: Pos): Door | undefined {
  return map.doors.find((d) => samePos(d.pos, p))
}

export function doorOf(map: CityMap, placeId: string): Door {
  const door = map.doors.find((d) => d.placeId === placeId)
  if (!door) throw new Error(`no door for place ${placeId}`)
  return door
}

/**
 * Parse a map from rows of characters.
 * `.` road, `,` grass, `^` tree, `~` water, `@` start (road).
 * A place's building is its uppercase letter, its single door the lowercase letter.
 */
export function parseMap(rows: string[], placeLetters: Record<string, string>): CityMap {
  const height = rows.length
  const width = rows[0]?.length ?? 0
  if (height === 0 || width === 0) throw new Error('empty map')
  const tiles: Tile[][] = []
  const placeAt: (string | null)[][] = []
  const doorPos: Record<string, Pos[]> = {}
  const starts: Pos[] = []

  rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`row ${y} has length ${row.length}, expected ${width}`)
    tiles.push([])
    placeAt.push([])
    ;[...row].forEach((ch, x) => {
      if (ch === '@') starts.push({ x, y })
      if (SIMPLE[ch]) {
        tiles[y].push(SIMPLE[ch])
        placeAt[y].push(null)
        return
      }
      const place = placeLetters[ch.toLowerCase()]
      if (!place) throw new Error(`unknown map letter ${JSON.stringify(ch)} at ${x},${y}`)
      const isDoor = ch === ch.toLowerCase()
      tiles[y].push(isDoor ? 'door' : 'building')
      placeAt[y].push(place)
      if (isDoor) (doorPos[place] ??= []).push({ x, y })
    })
  })

  if (starts.length !== 1) throw new Error('map needs exactly one @ start')

  const map: CityMap = { width, height, tiles, placeAt, doors: [], start: starts[0] }
  for (const place of Object.values(placeLetters)) {
    const found = doorPos[place] ?? []
    if (found.length !== 1) throw new Error(`place ${place} needs exactly one door`)
    const pos = found[0]
    const around: Pos[] = [
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x, y: pos.y - 1 },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x + 1, y: pos.y },
    ]
    const outside = around.find((p) => isWalkable(map, p) && map.tiles[p.y][p.x] !== 'door')
    if (!outside) throw new Error(`door of ${place} has no walkable tile outside`)
    map.doors.push({ placeId: place, pos, outside })
  }
  return map
}

// prettier-ignore
export const CITY_ROWS: string[] = [
  '^KKK^.^SSS^',
  ',KKK,.,SSS,',
  ',,k,,.,,s,,',
  '...........',
  '~~,,.@.,,~~',
  '...........',
  ',,c,,.,,t,,',
  ',CCC,.,TTT,',
  '^CCC^.^TTT^',
]

export const CITY: CityMap = parseMap(CITY_ROWS, { c: 'cafe', s: 'supermarket', t: 'taxi', k: 'clinic' })
