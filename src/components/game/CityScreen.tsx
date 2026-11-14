import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { PLACE_ART, PLAYER_EMOJI, TILE_EMOJI } from '@/game/art'
import { CITY, samePos, type Pos, type Tile } from '@/game/map'
import { keyToDir, step, type Dir } from '@/game/movement'
import { findPath, resolveTapTarget } from '@/game/path'
import type { GameState } from '@/game/state'
import { cn } from '@/lib/utils'
import { getScenario } from '@/shared/scenarios'
import { TopBar } from './TopBar'

export const STEP_MS = 120

// Warm palette matching the homepage street scene. Buildings take their place's colour (see tileStyle).
const TILE_CLASS: Record<Tile, string> = {
  road: 'bg-[#E9DCC8]',
  grass: 'bg-[#B5DC8F]',
  tree: 'bg-[#B5DC8F]',
  water: 'bg-[#9AD7F2]',
  building: '',
  door: '',
}

function tileStyle(tile: Tile, place: string | null): CSSProperties | undefined {
  if (!place || (tile !== 'building' && tile !== 'door')) return undefined
  const color = PLACE_ART[place].color
  return tile === 'door' ? { background: `${color}55` } : { background: `${color}30`, boxShadow: `inset 0 0 0 1px ${color}40` }
}

/** The building tile next to each door shows the place sign. */
const SIGN_TILES = new Map<string, string>(
  CITY.doors.flatMap((d) => {
    const around = [
      { x: d.pos.x, y: d.pos.y - 1 },
      { x: d.pos.x, y: d.pos.y + 1 },
    ]
    const sign = around.find((p) => CITY.tiles[p.y]?.[p.x] === 'building')
    return sign ? [[`${sign.x},${sign.y}`, d.placeId] as [string, string]] : []
  }),
)

/** Bounding box of each place's building tiles, for the name label. */
const BUILDING_BOXES = CITY.doors.map((d) => {
  const cells = CITY.placeAt.flatMap((row, y) =>
    row.flatMap((p, x) => (p === d.placeId && CITY.tiles[y][x] === 'building' ? [{ x, y }] : [])),
  )
  const xs = cells.map((c) => c.x)
  const ys = cells.map((c) => c.y)
  const top = Math.min(...ys)
  const bottom = Math.max(...ys)
  // Put the name on the edge away from the door, so it never covers the sign next to the door.
  const labelAtBottom = d.pos.y < top
  return { placeId: d.placeId, x: Math.min(...xs), w: Math.max(...xs) - Math.min(...xs) + 1, top, bottom, labelAtBottom }
})

const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)

export function CityScreen(props: {
  state: GameState
  startPos: Pos
  showHint: boolean
  /** Ignore keys and taps (e.g. while an overlay is open). */
  paused?: boolean
  onEnterPlace: (placeId: string) => void
  onOpenCelebration: () => void
  onMoved: () => void
}) {
  const [pos, setPos] = useState<Pos>(props.startPos)
  const posRef = useRef(pos)
  const walkTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const entered = useRef(false)
  const moved = useRef(false)
  const propsRef = useRef(props)
  propsRef.current = props

  const stopWalk = useCallback(() => {
    if (walkTimer.current) clearInterval(walkTimer.current)
    walkTimer.current = null
  }, [])

  /** Move to an adjacent tile (already known to be walkable) and handle doors. */
  const moveTo = useCallback(
    (next: Pos, enteredPlace?: string) => {
      if (entered.current || samePos(next, posRef.current)) return
      posRef.current = next
      setPos(next)
      if (!moved.current) {
        moved.current = true
        propsRef.current.onMoved()
      }
      if (enteredPlace) {
        entered.current = true
        stopWalk()
        propsRef.current.onEnterPlace(enteredPlace)
      }
    },
    [stopWalk],
  )

  const stepDir = useCallback(
    (dir: Dir) => {
      const r = step(CITY, posRef.current, dir)
      moveTo(r.pos, r.enteredPlace)
    },
    [moveTo],
  )

  const walkTo = useCallback(
    (tapped: Pos) => {
      stopWalk()
      if (entered.current || propsRef.current.paused) return
      const target = resolveTapTarget(CITY, tapped)
      const path = target && findPath(CITY, posRef.current, target)
      if (!path || path.length === 0) return
      const queue = [...path]
      walkTimer.current = setInterval(() => {
        const next = queue.shift()
        if (!next) return stopWalk()
        const door = CITY.doors.find((d) => samePos(d.pos, next))
        moveTo(next, door?.placeId)
        if (queue.length === 0) stopWalk()
      }, STEP_MS)
    },
    [moveTo, stopWalk],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (propsRef.current.paused || isTypingTarget(e.target)) return
      const dir = keyToDir(e.key)
      if (!dir) return
      e.preventDefault()
      stopWalk()
      stepDir(dir)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      stopWalk()
    }
  }, [stepDir, stopWalk])

  useEffect(() => {
    if (props.paused) stopWalk()
  }, [props.paused, stopWalk])

  const pct = (n: number, of: number) => `${(n / of) * 100}%`
  // Sizes relative to one tile's width (container query units), so the map scales on any screen.
  const tileFont = (share: number) => `calc(100cqw / ${CITY.width} * ${share})`

  return (
    <div
      className="mx-auto space-y-3"
      // The whole column (bar, map, hints) is as wide as the map can be on this screen.
      style={{ width: `min(100%, calc((100svh - 10.5rem) * ${CITY.width} / ${CITY.height}))` }}
    >
      <TopBar state={props.state} onOpenCelebration={props.onOpenCelebration} />
      {props.showHint && (
        <p className="text-center text-sm font-semibold text-[#2F7F7A]">Đi đến một địa điểm để bắt đầu</p>
      )}
      <div
        className="relative w-full touch-manipulation overflow-hidden rounded-[22px] border-2 border-[#2B1D16] shadow-[5px_5px_0_#2B1D16] select-none"
        style={{
          aspectRatio: `${CITY.width} / ${CITY.height}`,
          containerType: 'inline-size',
        }}
      >
        <div
          className="grid h-full w-full"
          style={{ gridTemplateColumns: `repeat(${CITY.width}, 1fr)`, gridTemplateRows: `repeat(${CITY.height}, 1fr)` }}
        >
          {CITY.tiles.flatMap((row, y) =>
            row.map((tile, x) => {
              const signPlace = SIGN_TILES.get(`${x},${y}`)
              return (
                <div
                  key={`${x},${y}`}
                  data-tile={`${x},${y}`}
                  onClick={() => {
                    walkTo({ x, y })
                  }}
                  className={cn('relative flex cursor-pointer items-center justify-center', TILE_CLASS[tile])}
                  style={{ fontSize: tileFont(0.6), ...tileStyle(tile, CITY.placeAt[y][x]) }}
                  aria-label={signPlace ? `Đi đến ${getScenario(signPlace)?.name_vi}` : undefined}
                >
                  {signPlace ? PLACE_ART[signPlace].sign : TILE_EMOJI[tile]}
                  {signPlace && props.state.stamps.includes(signPlace) && (
                    <span className="absolute right-0 top-0 text-[0.6em]" aria-hidden>
                      ✓
                    </span>
                  )}
                </div>
              )
            }),
          )}
        </div>
        {BUILDING_BOXES.map((b) => (
          <span
            key={b.placeId}
            className={cn(
              'pointer-events-none absolute truncate px-0.5 text-center font-bold leading-tight text-white',
              b.labelAtBottom ? 'rounded-t' : 'rounded-b',
            )}
            style={{
              left: pct(b.x, CITY.width),
              ...(b.labelAtBottom
                ? { bottom: pct(CITY.height - 1 - b.bottom, CITY.height) }
                : { top: pct(b.top, CITY.height) }),
              width: pct(b.w, CITY.width),
              background: PLACE_ART[b.placeId].color,
              fontSize: `max(0.55rem, ${tileFont(0.24)})`,
            }}
          >
            {getScenario(b.placeId)?.name_vi}
          </span>
        ))}
        <div
          data-testid="player"
          data-x={pos.x}
          data-y={pos.y}
          aria-label="Bạn"
          className="pointer-events-none absolute flex items-center justify-center"
          style={{
            fontSize: tileFont(0.7),
            width: pct(1, CITY.width),
            height: pct(1, CITY.height),
            left: 0,
            top: 0,
            transform: `translate(${pos.x * 100}%, ${pos.y * 100}%)`,
            transition: `transform ${STEP_MS}ms linear`,
          }}
        >
          {PLAYER_EMOJI}
        </div>
      </div>
      <p className="text-center text-xs font-medium text-[#2B1D16]/55">
        <span className="pointer-coarse:hidden">Dùng phím mũi tên / WASD hoặc bấm vào bản đồ để đi</span>
        <span className="hidden pointer-coarse:inline">Chạm vào bản đồ để đi</span>
      </p>
    </div>
  )
}
