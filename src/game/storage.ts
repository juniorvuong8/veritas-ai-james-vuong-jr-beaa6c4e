import { PLACE_IDS, type BenchDay, type GameState, type LearnedWord } from './state'

export const SAVE_KEY = 'vocab-city-v1'

const defaultStorage = () => window.localStorage

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

const optString = (v: unknown) => v === undefined || typeof v === 'string'

function isLearnedWord(v: unknown): v is LearnedWord {
  if (typeof v !== 'object' || v === null) return false
  const w = v as Record<string, unknown>
  return (
    ['word', 'input', 'meaning_vi', 'usage_vi', 'placeId'].every((k) => typeof w[k] === 'string') &&
    optString(w.meaning_en) &&
    optString(w.usage_en) &&
    optString(w.lastTested)
  )
}

/** Saves from before the notebook have no list: start empty. Broken entries are dropped, not the whole save. */
const parseLearned = (v: unknown): LearnedWord[] => (Array.isArray(v) ? v.filter(isLearnedWord) : [])

/** Saves from before the bench have none; a malformed record is ignored, not fatal. */
function parseBenchDay(v: unknown): BenchDay | null {
  if (typeof v !== 'object' || v === null) return null
  const b = v as Record<string, unknown>
  if (typeof b.date !== 'string' || typeof b.chats !== 'number' || !Number.isInteger(b.chats) || b.chats < 0) return null
  if (typeof b.paid !== 'object' || b.paid === null || Array.isArray(b.paid)) return null
  const paid: BenchDay['paid'] = {}
  for (const [k, checks] of Object.entries(b.paid)) {
    if (!Array.isArray(checks) || !checks.every((c) => c === 'understand' || c === 'use')) return null
    paid[k] = [...new Set(checks as ('understand' | 'use')[])]
  }
  return { date: b.date, chats: b.chats, paid }
}

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
    learnedWords: parseLearned(g.learnedWords),
    benchDay: parseBenchDay(g.benchDay),
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
