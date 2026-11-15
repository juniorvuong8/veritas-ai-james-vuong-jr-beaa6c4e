import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { PLACE_ART, TILE_EMOJI } from '@/game/art'
import { CITY, samePos, type Pos, type Tile } from '@/game/map'
import { keyToDir, step, type Dir } from '@/game/movement'
import { findPath, resolveTapTarget } from '@/game/path'
import type { GameState } from '@/game/state'
import { Bi, useBiText } from '@/lib/debug'
import { cn } from '@/lib/utils'
import { getScenario } from '@/shared/scenarios'
import { Avatar } from './Avatar'
import { TopBar } from './TopBar'
import { GhostButton, PrimaryButton } from './ui'

export const STEP_MS = 120
/** On a door: finish the step, pause a moment on the doorstep, then fade the screen to black. */
export const DOOR_PAUSE_MS = 250
export const FADE_MS = 300
/** Time from stepping onto a door until the place opens. */
export const ENTER_DELAY_MS = STEP_MS + DOOR_PAUSE_MS + FADE_MS

// Warm palette matching the homepage street scene. Buildings take their place's colour (see tileStyle).
const TILE_CLASS: Record<Tile, string> = {
  road: 'bg-[#E9DCC8]',
  grass: 'bg-[#B5DC8F]',
  tree: 'bg-[#B5DC8F]',
  water: 'bg-[#9AD7F2]',
  // The fountain sits in the town square, on paving like the roads.
  fountain: 'bg-[#E9DCC8]',
  building: '',
  door: '',
}

function tileStyle(tile: Tile, place: string | null): CSSProperties | undefined {
  if (!place || (tile !== 'building' && tile !== 'door')) return undefined
  // The door sits inside the building, so it shares the building's wall colour.
  const color = PLACE_ART[place].color
  return { background: `${color}30`, boxShadow: `inset 0 0 0 1px ${color}40` }
}

/** Striped shop awning over a door, in the place's colour. */
function Awning({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-[6%] top-[6%] h-[26%] rounded-b-[30%] shadow-[0_2px_0_rgba(43,29,22,0.25)]"
      style={{ background: `repeating-linear-gradient(90deg, ${color} 0 20%, #FFFFFF 20% 40%)` }}
    />
  )
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
  // Put the name on the edge away from the door, so it never covers the door or the sign next to it.
  const labelAtBottom = d.pos.y <= top
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
  onOpenNotebook?: () => void
  onOpenShop?: () => void
  onMoved: () => void
}) {
  const [pos, setPos] = useState<Pos>(props.startPos)
  const biText = useBiText()
  const posRef = useRef(pos)
  const walkTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const entered = useRef(false)
  const [fading, setFading] = useState(false)
  /** A finished place whose door the player just stepped on: ask before going in again. */
  const [revisit, setRevisit] = useState<string | null>(null)
  const revisitRef = useRef<string | null>(null)
  revisitRef.current = revisit
  const enterTimers = useRef<ReturnType<typeof setTimeout>[]>([])
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
        stopWalk()
        if (propsRef.current.state.stamps.includes(enteredPlace)) setRevisit(enteredPlace)
        else enterPlace(enteredPlace)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- enterPlace only uses refs and setters
    [stopWalk],
  )

  /** Finish the step onto the door, pause, fade to black, then open the place. */
  function enterPlace(placeId: string, delayMs = STEP_MS + DOOR_PAUSE_MS) {
    entered.current = true
    enterTimers.current.push(
      setTimeout(() => setFading(true), delayMs),
      setTimeout(() => propsRef.current.onEnterPlace(placeId), delayMs + FADE_MS),
    )
  }

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
      if (entered.current || propsRef.current.paused || revisitRef.current) return
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
      if (revisitRef.current) {
        if (e.key === 'Escape') setRevisit(null)
        return
      }
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
      enterTimers.current.forEach(clearTimeout)
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
      <TopBar
        state={props.state}
        onOpenCelebration={props.onOpenCelebration}
        onOpenNotebook={props.onOpenNotebook}
        onOpenShop={props.onOpenShop}
      />
      {props.showHint && (
        <p className="text-center text-sm font-semibold text-[#2F7F7A]">
          <Bi vi="Đi đến một địa điểm để bắt đầu" en="Walk to a place to start" />
        </p>
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
                  aria-label={
                    signPlace
                      ? biText(`Đi đến ${getScenario(signPlace)?.name_vi}`, `Go to ${getScenario(signPlace)?.name_en}`)
                      : undefined
                  }
                >
                  {tile === 'door' ? (
                    <>
                      <Awning color={PLACE_ART[CITY.placeAt[y][x]!].color} />
                      <span className="translate-y-[14%] text-[0.85em]">{TILE_EMOJI.door}</span>
                    </>
                  ) : signPlace ? (
                    PLACE_ART[signPlace].sign
                  ) : (
                    TILE_EMOJI[tile]
                  )}
                  {signPlace && props.state.stamps.includes(signPlace) && (
                    <span
                      data-testid={`done-${signPlace}`}
                      className="absolute top-[4%] right-[4%] grid size-[38%] place-items-center rounded-full bg-[#22A04B] text-[0.4em] font-black text-white shadow-[0_1px_0_rgba(0,0,0,0.25)]"
                      aria-hidden
                    >
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
            {biText(getScenario(b.placeId)?.name_vi ?? '', getScenario(b.placeId)?.name_en)}
          </span>
        ))}
        <div
          data-testid="player"
          data-x={pos.x}
          data-y={pos.y}
          aria-label={biText('Bạn', 'You')}
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
          <Avatar outfit={props.state.outfit} gender={props.state.gender} />
        </div>
      </div>
      <p className="text-center text-xs font-medium text-[#2B1D16]/55">
        <span className="pointer-coarse:hidden">
          <Bi
            vi="Dùng phím mũi tên / WASD hoặc bấm vào bản đồ để đi"
            en="Use the arrow keys / WASD or click the map to walk"
          />
        </span>
        <span className="hidden pointer-coarse:inline">
          <Bi vi="Chạm vào bản đồ để đi" en="Tap the map to walk" />
        </span>
      </p>
      {revisit && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#2B1D16]/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revisit-title"
            className="bubble-in w-full max-w-sm space-y-4 rounded-[28px] border-2 border-[#2B1D16] bg-[#FFF8EE] p-6 text-center shadow-[6px_6px_0_#2B1D16]"
          >
            <div className="flex justify-center gap-2 text-5xl" aria-hidden>
              {PLACE_ART[revisit].sign}
              <span className="grid size-12 place-items-center self-center rounded-full bg-[#22A04B] text-2xl font-black text-white">
                ✓
              </span>
            </div>
            <h2 id="revisit-title" className="text-xl font-extrabold tracking-tight">
              <Bi
                vi={`Bạn đã đến ${getScenario(revisit)?.name_vi} rồi!`}
                en={`You've already been to the ${getScenario(revisit)?.name_en}!`}
              />
            </h2>
            <p className="text-sm text-[#2B1D16]/70">
              <Bi
                vi="Bạn đã có con dấu ở đây. Vào lại để luyện thêm từ mới, hoặc đi tiếp đến nơi khác."
                en="You already have the stamp here. Go in again to practise more words, or head somewhere else."
              />
            </p>
            <div className="grid gap-2">
              <PrimaryButton
                autoFocus
                onClick={() => {
                  setRevisit(null)
                  enterPlace(revisit, 0)
                }}
              >
                <Bi vi="Vào lại" en="Go in again" />
              </PrimaryButton>
              <GhostButton onClick={() => setRevisit(null)}>
                <Bi vi="Ở ngoài" en="Stay outside" />
              </GhostButton>
            </div>
          </div>
        </div>
      )}
      {/* Fades the whole screen to black as the player goes through a door. */}
      <div
        data-testid="door-fade"
        aria-hidden
        className={cn('pointer-events-none fixed inset-0 z-50 bg-black', fading ? 'opacity-100' : 'opacity-0')}
        style={{ transition: `opacity ${FADE_MS}ms ease-in` }}
      />
    </div>
  )
}
