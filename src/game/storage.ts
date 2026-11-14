import { PLACE_IDS, type GameState } from './state'

export const SAVE_KEY = 'vocab-city-v1'

const defaultStorage = () => window.localStorage

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

function parseGame(raw: unknown): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const g = raw as Record<string, unknown>
  if (g.level !== 1 && g.level !== 2 && g.level !== 3) return null
  if (!isStringArray(g.stamps) || !g.stamps.every((s) => PLACE_IDS.includes(s))) return null
  if (new Set(g.stamps).size !== g.stamps.length) return null
  if (typeof g.coins !== 'number' || !Number.isInteger(g.coins) || g.coins < 0) return null
  if (typeof g.complete !== 'boolean' || g.complete !== (g.stamps.length === PLACE_IDS.length)) return null
  if (typeof g.lastWords !== 'object' || g.lastWords === null || Array.isArray(g.lastWords)) return null
  const lastWords = g.lastWords as Record<string, unknown>
  if (!Object.values(lastWords).every(isStringArray)) return null
  return {
    level: g.level,
    stamps: PLACE_IDS.filter((id) => (g.stamps as string[]).includes(id)),
    coins: g.coins,
    complete: g.complete,
    celebrationOpen: false,
    lastWords: lastWords as Record<string, string[]>,
  }
}

/** Saved game, or null when there is none, it is invalid, or storage is unavailable. */
export function loadGame(getStorage: () => Storage = defaultStorage): GameState | null {
  try {
    const text = getStorage().getItem(SAVE_KEY)
    return text === null ? null : parseGame(JSON.parse(text))
  } catch {
    return null
  }
}

export function saveGame(state: GameState, getStorage: () => Storage = defaultStorage): void {
  try {
    getStorage().setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    // Private mode or blocked storage: the game still works, it just won't remember.
  }
}

export function clearGame(getStorage: () => Storage = defaultStorage): void {
  try {
    getStorage().removeItem(SAVE_KEY)
  } catch {
    // ignore
  }
}
